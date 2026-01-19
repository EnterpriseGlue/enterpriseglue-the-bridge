import { Router, Request, Response } from 'express';
import { logger } from '@shared/utils/logger.js';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { getDataSource } from '@shared/db/data-source.js';
import { User } from '@shared/db/entities/User.js';
import { Invitation } from '@shared/db/entities/Invitation.js';
import { Tenant } from '@shared/db/entities/Tenant.js';
import { TenantSettings } from '@shared/db/entities/TenantSettings.js';
import { TenantMembership } from '@shared/db/entities/TenantMembership.js';
import { EngineMember } from '@shared/db/entities/EngineMember.js';
import { ProjectMember } from '@shared/db/entities/ProjectMember.js';
import { generateId } from '@shared/utils/id.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { validateBody, validateParams } from '@shared/middleware/validate.js';
import { logAudit, AuditActions } from '@shared/services/audit.js';
import { config } from '@shared/config/index.js';
import { sendInvitationEmail } from '@shared/services/email/index.js';
import { DataSource } from 'typeorm';

const router = Router();

const createInvitationSchema = z.object({
  email: z.string().email(),
  resourceType: z.enum(['tenant', 'project', 'engine']),
  resourceId: z.string().optional(),
  role: z.string().optional(),
});

const inviteParamsSchema = z.object({
  tenantSlug: z.string().min(1),
});

async function requireTenantAdminOrPlatformAdmin(dataSource: DataSource, req: Request, tenantId: string) {
  if (req.user?.platformRole === 'admin') return;

  const membershipRepo = dataSource.getRepository(TenantMembership);
  const membership = await membershipRepo.findOne({
    where: { tenantId, userId: req.user!.userId },
    select: ['role']
  });

  if (!membership || membership.role !== 'tenant_admin') {
    const err: any = new Error('Only tenant admins can manage invitations');
    err.statusCode = 403;
    throw err;
  }
}

router.post('/api/t/:tenantSlug/invitations', requireAuth, validateParams(inviteParamsSchema), validateBody(createInvitationSchema), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const body = req.body;
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const settingsRepo = dataSource.getRepository(TenantSettings);
    const inviteRepo = dataSource.getRepository(Invitation);
    const now = Date.now();

    const tenant = await tenantRepo.findOne({
      where: { slug: tenantSlug },
      select: ['id', 'name']
    });

    if (!tenant) {
      throw Errors.tenantNotFound();
    }

    try {
      await requireTenantAdminOrPlatformAdmin(dataSource, req, tenant.id);
    } catch (e: any) {
      return res.status(e?.statusCode || 403).json({ error: e?.message || 'Only tenant admins can send invitations' });
    }

    const settings = await settingsRepo.findOne({ where: { tenantId: tenant.id } });

    if (settings && !settings.inviteAllowAllDomains) {
      const allowedDomains: string[] = JSON.parse(settings.inviteAllowedDomains || '[]');
      const emailDomain = body.email.split('@')[1]?.toLowerCase();
      if (!allowedDomains.includes(emailDomain)) {
        throw Errors.notFound('Email domain');
      }
    }

    const existingPendingQb = inviteRepo.createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId: tenant.id })
      .andWhere('i.email = :email', { email: body.email.toLowerCase() })
      .andWhere('i.resourceType = :resourceType', { resourceType: body.resourceType })
      .andWhere('i.acceptedAt IS NULL')
      .andWhere('i.revokedAt IS NULL');
    
    if (body.resourceId) {
      existingPendingQb.andWhere('i.resourceId = :resourceId', { resourceId: body.resourceId });
    } else {
      existingPendingQb.andWhere('i.resourceId IS NULL');
    }

    const existingPending = await existingPendingQb.getOne();

    if (existingPending) {
      throw Errors.conflict('An invitation is already pending for this email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitationId = generateId();
    await inviteRepo.insert({
      id: invitationId,
      token,
      email: body.email.toLowerCase(),
      tenantId: tenant.id,
      resourceType: body.resourceType,
      resourceId: body.resourceId || null,
      role: body.role || 'member',
      invitedByUserId: req.user!.userId,
      expiresAt,
      createdAt: now,
    });

    const inviteUrl = `${config.frontendUrl}/t/${tenantSlug}/invite/${token}`;

    try {
      await sendInvitationEmail({
        to: body.email.toLowerCase(),
        tenantName: tenant.name,
        inviteUrl,
        resourceType: body.resourceType,
        invitedByName: req.user!.email,
      });
    } catch (emailError) {
      logger.error('Failed to send invitation email:', emailError);
    }

    await logAudit({
      tenantId: tenant.id,
      action: AuditActions.USER_CREATE,
      userId: req.user!.userId,
      resourceType: 'invitation',
      resourceId: invitationId,
      details: { email: body.email, resourceType: body.resourceType, resourceId: body.resourceId },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      id: invitationId,
      email: body.email.toLowerCase(),
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      expiresAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw Errors.validation('Validation failed');
    }
    logger.error('Create invitation error:', error);
    throw Errors.internal('Failed to create invitation');
  }
}));

router.get('/api/t/:tenantSlug/invitations', requireAuth, validateParams(inviteParamsSchema), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const inviteRepo = dataSource.getRepository(Invitation);

    const tenant = await tenantRepo.findOne({
      where: { slug: tenantSlug },
      select: ['id']
    });

    if (!tenant) {
      throw Errors.tenantNotFound();
    }

    try {
      await requireTenantAdminOrPlatformAdmin(dataSource, req, tenant.id);
    } catch (e: any) {
      return res.status(e?.statusCode || 403).json({ error: e?.message || 'Only tenant admins can view invitations' });
    }

    const result = await inviteRepo.find({
      where: { tenantId: tenant.id },
      select: ['id', 'email', 'resourceType', 'resourceId', 'role', 'expiresAt', 'acceptedAt', 'revokedAt', 'createdAt'],
      order: { createdAt: 'DESC' }
    });

    res.json(result);
  } catch (error: any) {
    logger.error('List invitations error:', error);
    throw Errors.internal('Failed to list invitations');
  }
}));

router.delete('/api/t/:tenantSlug/invitations/:invitationId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tenantSlug, invitationId } = req.params;
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const inviteRepo = dataSource.getRepository(Invitation);
    const now = Date.now();

    const tenant = await tenantRepo.findOne({
      where: { slug: tenantSlug },
      select: ['id']
    });

    if (!tenant) {
      throw Errors.tenantNotFound();
    }

    try {
      await requireTenantAdminOrPlatformAdmin(dataSource, req, tenant.id);
    } catch (e: any) {
      return res.status(e?.statusCode || 403).json({ error: e?.message || 'Only tenant admins can revoke invitations' });
    }

    const invite = await inviteRepo.findOne({
      where: { id: invitationId, tenantId: tenant.id }
    });

    if (!invite) {
      throw Errors.notFound('Invitation');
    }

    if (invite.acceptedAt) {
      throw Errors.validation('Invitation already accepted');
    }

    if (invite.revokedAt) {
      throw Errors.validation('Invitation already revoked');
    }

    await inviteRepo.update({ id: invitationId }, {
      revokedAt: now,
      revokedByUserId: req.user!.userId,
    });

    await logAudit({
      tenantId: tenant.id,
      action: AuditActions.USER_UPDATE,
      userId: req.user!.userId,
      resourceType: 'invitation',
      resourceId: invitationId,
      details: { revoked: true },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Revoke invitation error:', error);
    throw Errors.internal('Failed to revoke invitation');
  }
}));

router.post('/api/t/:tenantSlug/invitations/:invitationId/resend', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tenantSlug, invitationId } = req.params;
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const inviteRepo = dataSource.getRepository(Invitation);
    const now = Date.now();

    const tenant = await tenantRepo.findOne({
      where: { slug: tenantSlug },
      select: ['id', 'name', 'slug']
    });

    if (!tenant) {
      throw Errors.tenantNotFound();
    }

    try {
      await requireTenantAdminOrPlatformAdmin(dataSource, req, tenant.id);
    } catch (e: any) {
      return res.status(e?.statusCode || 403).json({ error: e?.message || 'Only tenant admins can resend invitations' });
    }

    const invite = await inviteRepo.findOne({
      where: { id: invitationId, tenantId: tenant.id },
      select: ['id', 'token', 'email', 'resourceType', 'resourceId', 'role', 'expiresAt', 'acceptedAt', 'revokedAt']
    });
    if (!invite) {
      throw Errors.notFound('Invitation');
    }

    if (invite.acceptedAt) {
      throw Errors.validation('Invitation already accepted');
    }

    if (invite.revokedAt) {
      throw Errors.validation('Invitation already revoked');
    }

    if (invite.expiresAt && invite.expiresAt < now) {
      throw Errors.validation('Invitation expired');
    }

    const inviteUrl = `${config.frontendUrl}/t/${tenant.slug}/invite/${invite.token}`;

    try {
      await sendInvitationEmail({
        to: String(invite.email || '').toLowerCase(),
        tenantName: tenant.name,
        inviteUrl,
        resourceType: invite.resourceType as 'tenant' | 'project' | 'engine',
        invitedByName: req.user!.email,
      });
    } catch (emailError) {
      logger.error('Failed to resend invitation email:', emailError);
    }

    await logAudit({
      tenantId: tenant.id,
      action: AuditActions.USER_UPDATE,
      userId: req.user!.userId,
      resourceType: 'invitation',
      resourceId: invitationId,
      details: { resent: true },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw Errors.validation('Validation failed');
    }
    logger.error('Resend invitation error:', error);
    throw Errors.internal('Failed to resend invitation');
  }
}));

router.get('/api/invitations/:token', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const dataSource = await getDataSource();
    const inviteRepo = dataSource.getRepository(Invitation);
    const now = Date.now();

    const result = await inviteRepo.createQueryBuilder('i')
      .innerJoin(Tenant, 't', 't.id = i.tenantId')
      .where('i.token = :token', { token })
      .select([
        'i.id AS id',
        'i.email AS email',
        'i.tenantId AS "tenantId"',
        't.name AS "tenantName"',
        't.slug AS "tenantSlug"',
        'i.resourceType AS "resourceType"',
        'i.resourceId AS "resourceId"',
        'i.role AS role',
        'i.expiresAt AS "expiresAt"',
        'i.acceptedAt AS "acceptedAt"',
        'i.revokedAt AS "revokedAt"'
      ])
      .getRawOne();

    if (!result) {
      throw Errors.notFound('Invitation');
    }

    if (result.revokedAt) {
      throw Errors.validation('Invitation has been revoked');
    }

    if (result.acceptedAt) {
      throw Errors.validation('Invitation already accepted');
    }

    if (result.expiresAt < now) {
      throw Errors.validation('Invitation has expired');
    }

    res.json({
      email: result.email,
      tenantName: result.tenantName,
      tenantSlug: result.tenantSlug,
      resourceType: result.resourceType,
      role: result.role,
    });
  } catch (error: any) {
    logger.error('Get invitation error:', error);
    throw Errors.internal('Failed to get invitation');
  }
}));

router.post('/api/invitations/:token/accept', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const dataSource = await getDataSource();
    const inviteRepo = dataSource.getRepository(Invitation);
    const tenantRepo = dataSource.getRepository(Tenant);
    const userRepo = dataSource.getRepository(User);
    const membershipRepo = dataSource.getRepository(TenantMembership);
    const projectMemberRepo = dataSource.getRepository(ProjectMember);
    const engineMemberRepo = dataSource.getRepository(EngineMember);
    const now = Date.now();

    const invite = await inviteRepo.findOne({ where: { token } });

    if (!invite) {
      throw Errors.notFound('Invitation');
    }

    const tenant = await tenantRepo.findOne({
      where: { id: invite.tenantId },
      select: ['id', 'slug']
    });

    if (!tenant) {
      throw Errors.notFound('Tenant');
    }

    if (invite.revokedAt) {
      throw Errors.validation('Invitation has been revoked');
    }

    if (invite.acceptedAt) {
      throw Errors.validation('Invitation already accepted');
    }

    if (invite.expiresAt < now) {
      throw Errors.validation('Invitation has expired');
    }

    const currentUser = await userRepo.findOne({
      where: { id: req.user!.userId },
      select: ['email']
    });

    if (!currentUser || currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw Errors.forbidden('This invitation was sent to a different email address');
    }

    await inviteRepo.update({ id: invite.id }, {
      acceptedAt: now,
      acceptedByUserId: req.user!.userId,
    });

    if (invite.resourceType === 'tenant') {
      const existingMembership = await membershipRepo.findOne({
        where: { tenantId: invite.tenantId, userId: req.user!.userId },
        select: ['id']
      });

      if (!existingMembership) {
        await membershipRepo.insert({
          id: generateId(),
          tenantId: invite.tenantId,
          userId: req.user!.userId,
          role: invite.role,
          createdAt: now,
        });
      }
    } else if (invite.resourceType === 'project' && invite.resourceId) {
      const existingMember = await projectMemberRepo.findOne({
        where: { projectId: invite.resourceId, userId: req.user!.userId },
        select: ['id']
      });

      if (!existingMember) {
        await projectMemberRepo.insert({
          id: generateId(),
          projectId: invite.resourceId,
          userId: req.user!.userId,
          role: invite.role,
          invitedById: invite.invitedByUserId,
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else if (invite.resourceType === 'engine' && invite.resourceId) {
      const existingMember = await engineMemberRepo.findOne({
        where: { engineId: invite.resourceId, userId: req.user!.userId },
        select: ['id']
      });

      if (!existingMember) {
        await engineMemberRepo.insert({
          id: generateId(),
          engineId: invite.resourceId,
          userId: req.user!.userId,
          role: invite.role,
          grantedById: invite.invitedByUserId,
          createdAt: now,
        });
      }
    }

    res.json({
      success: true,
      tenantSlug: tenant.slug,
      resourceType: invite.resourceType,
    });
  } catch (error: any) {
    logger.error('Accept invitation error:', error);
    throw Errors.internal('Failed to accept invitation');
  }
}));

export default router;
