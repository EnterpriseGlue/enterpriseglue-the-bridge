import { Router } from 'express';
import { apiLimiter } from '@shared/middleware/rateLimiter.js';
import { logger } from '@shared/utils/logger.js';
import { z } from 'zod';
import { requireAuth } from '@shared/middleware/auth.js';
import { resolveTenantContext, requireTenantRole } from '@shared/middleware/tenant.js';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { validateBody, validateParams } from '@shared/middleware/validate.js';
import { getDataSource } from '@shared/db/data-source.js';
import { TenantMembership } from '@shared/db/entities/TenantMembership.js';
import { TenantSettings } from '@shared/db/entities/TenantSettings.js';
import { User } from '@shared/db/entities/User.js';
import { logAudit } from '@shared/services/audit.js';

const router = Router({ mergeParams: true });

router.use(requireAuth, resolveTenantContext({ required: true }), requireTenantRole('tenant_admin'));

router.get('/users', apiLimiter, asyncHandler(async (req, res) => {
  try {
    const tenantId = req.tenant!.tenantId;
    const dataSource = await getDataSource();
    const membershipRepo = dataSource.getRepository(TenantMembership);

    const rows = await membershipRepo.createQueryBuilder('tm')
      .innerJoin(User, 'u', 'u.id = tm.userId')
      .where('tm.tenantId = :tenantId', { tenantId })
      .orderBy('u.email', 'ASC')
      .select([
        'u.id AS userId',
        'u.email AS email',
        'u.firstName AS "firstName"',
        'u.lastName AS "lastName"',
        'tm.role AS role',
        'tm.createdAt AS "createdAt"'
      ])
      .getRawMany();

    res.json(rows);
  } catch (error) {
    logger.error('List tenant users error:', error);
    throw Errors.internal('Failed to list tenant users');
  }
}));

const userIdParamsSchema = z.object({ userId: z.string().min(1) });
const updateTenantUserRoleSchema = z.object({ role: z.enum(['member', 'tenant_admin']) });

async function ensureNotLastTenantAdmin(membershipRepo: any, tenantId: string, targetUserId: string) {
  const admins = await membershipRepo.find({
    where: { tenantId, role: 'tenant_admin' },
    select: ['userId']
  });

  if (admins.length <= 1 && admins[0]?.userId === targetUserId) {
    return false;
  }

  return true;
}

router.patch('/users/:userId', apiLimiter, validateParams(userIdParamsSchema), validateBody(updateTenantUserRoleSchema), asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const tenantId = req.tenant!.tenantId;
    const dataSource = await getDataSource();
    const membershipRepo = dataSource.getRepository(TenantMembership);

    const membership = await membershipRepo.findOne({
      where: { tenantId, userId },
      select: ['id', 'role']
    });

    if (!membership) {
      throw Errors.notFound('Tenant membership');
    }

    if (membership.role === 'tenant_admin' && role !== 'tenant_admin') {
      const ok = await ensureNotLastTenantAdmin(membershipRepo, tenantId, userId);
      if (!ok) {
        throw Errors.validation('Cannot remove the last tenant admin');
      }
    }

    await membershipRepo.update({ tenantId, userId }, { role });

    await logAudit({
      tenantId,
      action: 'tenant.user.role.update',
      userId: req.user!.userId,
      resourceType: 'tenant_membership',
      resourceId: membership.id,
      details: { targetUserId: userId, role },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw Errors.validation('Validation failed', { details: error.errors });
    }
    logger.error('Update tenant user role error:', error);
    throw Errors.internal('Failed to update tenant user role');
  }
}));

router.delete('/users/:userId', apiLimiter, validateParams(userIdParamsSchema), asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    const tenantId = req.tenant!.tenantId;
    const dataSource = await getDataSource();
    const membershipRepo = dataSource.getRepository(TenantMembership);

    const membership = await membershipRepo.findOne({
      where: { tenantId, userId },
      select: ['id', 'role']
    });

    if (!membership) {
      throw Errors.notFound('Tenant membership');
    }

    if (membership.role === 'tenant_admin') {
      const ok = await ensureNotLastTenantAdmin(membershipRepo, tenantId, userId);
      if (!ok) {
        throw Errors.validation('Cannot remove the last tenant admin');
      }
    }

    await membershipRepo.delete({ tenantId, userId });

    await logAudit({
      tenantId,
      action: 'tenant.user.remove',
      userId: req.user!.userId,
      resourceType: 'tenant_membership',
      resourceId: membership.id,
      details: { targetUserId: userId },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw Errors.validation('Validation failed', { details: error.errors });
    }
    logger.error('Remove tenant user error:', error);
    throw Errors.internal('Failed to remove tenant user');
  }
}));

router.get('/settings', apiLimiter, asyncHandler(async (req, res) => {
  try {
    const tenantId = req.tenant!.tenantId;
    const dataSource = await getDataSource();
    const settingsRepo = dataSource.getRepository(TenantSettings);

    const row = await settingsRepo.findOne({ where: { tenantId } });

    if (!row) {
      return res.json({
        tenantId,
        inviteAllowAllDomains: true,
        inviteAllowedDomains: [],
        emailSendConfigId: null,
        logoUrl: null,
        logoTitle: null,
        logoScale: 100,
        titleFontUrl: null,
        titleFontWeight: '600',
        titleFontSize: 14,
        titleVerticalOffset: 0,
        menuAccentColor: null,
        updatedAt: null,
        updatedByUserId: null,
      });
    }

    const inviteAllowedDomains = (() => {
      try {
        return JSON.parse(String(row.inviteAllowedDomains || '[]')) as string[];
      } catch {
        return [];
      }
    })();

    res.json({
      tenantId: row.tenantId,
      inviteAllowAllDomains: row.inviteAllowAllDomains,
      inviteAllowedDomains,
      emailSendConfigId: row.emailSendConfigId,
      logoUrl: row.logoUrl,
      logoTitle: row.logoTitle,
      logoScale: row.logoScale,
      titleFontUrl: row.titleFontUrl,
      titleFontWeight: row.titleFontWeight,
      titleFontSize: row.titleFontSize,
      titleVerticalOffset: row.titleVerticalOffset,
      menuAccentColor: row.menuAccentColor,
      updatedAt: row.updatedAt,
      updatedByUserId: row.updatedByUserId,
    });
  } catch (error) {
    logger.error('Get tenant settings error:', error);
    throw Errors.internal('Failed to get tenant settings');
  }
}));

const updateTenantSettingsSchema = z
  .object({
    inviteAllowAllDomains: z.boolean().optional(),
    inviteAllowedDomains: z.array(z.string()).optional(),
    emailSendConfigId: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    logoTitle: z.string().nullable().optional(),
    logoScale: z.number().min(50).max(200).optional(),
    titleFontUrl: z.string().nullable().optional(),
    titleFontWeight: z.string().optional(),
    titleFontSize: z.number().min(10).max(32).optional(),
    titleVerticalOffset: z.number().min(-20).max(20).optional(),
    menuAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  })
  .strict();

router.put('/settings', apiLimiter, validateBody(updateTenantSettingsSchema), asyncHandler(async (req, res) => {
  try {
    const tenantId = req.tenant!.tenantId;
    const body = req.body;
    const dataSource = await getDataSource();
    const settingsRepo = dataSource.getRepository(TenantSettings);
    const now = Date.now();

    const existing = await settingsRepo.findOne({
      where: { tenantId },
      select: ['tenantId']
    });

    const dataToPersist: any = {
      updatedAt: now,
      updatedByUserId: req.user!.userId,
    };

    if (body.inviteAllowAllDomains !== undefined) dataToPersist.inviteAllowAllDomains = body.inviteAllowAllDomains;
    if (body.inviteAllowedDomains !== undefined) dataToPersist.inviteAllowedDomains = JSON.stringify(body.inviteAllowedDomains);
    if (body.emailSendConfigId !== undefined) dataToPersist.emailSendConfigId = body.emailSendConfigId;
    if (body.logoUrl !== undefined) dataToPersist.logoUrl = body.logoUrl;
    if (body.logoTitle !== undefined) dataToPersist.logoTitle = body.logoTitle;
    if (body.logoScale !== undefined) dataToPersist.logoScale = body.logoScale;
    if (body.titleFontUrl !== undefined) dataToPersist.titleFontUrl = body.titleFontUrl;
    if (body.titleFontWeight !== undefined) dataToPersist.titleFontWeight = body.titleFontWeight;
    if (body.titleFontSize !== undefined) dataToPersist.titleFontSize = body.titleFontSize;
    if (body.titleVerticalOffset !== undefined) dataToPersist.titleVerticalOffset = body.titleVerticalOffset;
    if (body.menuAccentColor !== undefined) dataToPersist.menuAccentColor = body.menuAccentColor;

    if (!existing) {
      await settingsRepo.insert({
        tenantId,
        inviteAllowAllDomains: dataToPersist.inviteAllowAllDomains ?? true,
        inviteAllowedDomains: dataToPersist.inviteAllowedDomains ?? '[]',
        emailSendConfigId: dataToPersist.emailSendConfigId ?? null,
        logoUrl: dataToPersist.logoUrl ?? null,
        logoTitle: dataToPersist.logoTitle ?? null,
        logoScale: dataToPersist.logoScale ?? 100,
        titleFontUrl: dataToPersist.titleFontUrl ?? null,
        titleFontWeight: dataToPersist.titleFontWeight ?? '600',
        titleFontSize: dataToPersist.titleFontSize ?? 14,
        titleVerticalOffset: dataToPersist.titleVerticalOffset ?? 0,
        menuAccentColor: dataToPersist.menuAccentColor ?? null,
        updatedAt: now,
        updatedByUserId: req.user!.userId,
      });
    } else {
      await settingsRepo.update({ tenantId }, dataToPersist);
    }

    await logAudit({
      tenantId,
      action: 'tenant.settings.update',
      userId: req.user!.userId,
      resourceType: 'tenant_settings',
      resourceId: tenantId,
      details: Object.keys(body),
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw Errors.validation('Validation failed', { details: error.errors });
    }
    logger.error('Update tenant settings error:', error);
    throw Errors.internal('Failed to update tenant settings');
  }
}));

export default router;
