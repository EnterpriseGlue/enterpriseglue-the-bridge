/**
 * Tenant Management Routes
 */

import { Router } from 'express';
import { apiLimiter } from '@shared/middleware/rateLimiter.js';
import { logger } from '@shared/utils/logger.js';
import { z } from 'zod';
import { validateBody, validateParams } from '@shared/middleware/validate.js';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { logAudit } from '@shared/services/audit.js';
import { getDataSource } from '@shared/db/data-source.js';
import { User } from '@shared/db/entities/User.js';
import { Tenant } from '@shared/db/entities/Tenant.js';
import { TenantSettings } from '@shared/db/entities/TenantSettings.js';
import { TenantMembership } from '@shared/db/entities/TenantMembership.js';
import { generateId } from '@shared/utils/id.js';

const router = Router();

const tenantIdParamsSchema = z.object({ tenantId: z.string().min(1) });

const createTenantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(['active', 'suspended']).optional(),
  initialAdminUserId: z.string().uuid().optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

const updateTenantSettingsSchema = z.object({
  inviteAllowAllDomains: z.boolean().optional(),
  inviteAllowedDomains: z.array(z.string()).optional(),
  emailSendConfigId: z.string().nullable().optional(),
});

const tenantAdminParamsSchema = z.object({ tenantId: z.string().min(1), userId: z.string().uuid() });
const tenantAdminBodySchema = z.object({ userId: z.string().uuid() });

// ============ Tenant CRUD ============

router.get('/', apiLimiter, asyncHandler(async (_req, res) => {
  try {
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const result = await tenantRepo.find({
      order: { createdAt: 'ASC' },
      select: ['id', 'name', 'slug', 'status', 'createdAt', 'updatedAt', 'createdByUserId']
    });

    res.json(result);
  } catch (error) {
    logger.error('List tenants error:', error);
    throw Errors.internal('Failed to list tenants');
  }
}));

router.post('/', apiLimiter, validateBody(createTenantSchema), asyncHandler(async (req, res) => {
  try {
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const settingsRepo = dataSource.getRepository(TenantSettings);
    const userRepo = dataSource.getRepository(User);
    const membershipRepo = dataSource.getRepository(TenantMembership);
    const now = Date.now();

    const existing = await tenantRepo.findOne({
      where: { slug: req.body.slug },
      select: ['id']
    });

    if (existing) {
      throw Errors.conflict('Tenant slug already exists');
    }

    const tenantId = generateId();
    await tenantRepo.insert({
      id: tenantId,
      name: req.body.name,
      slug: req.body.slug,
      status: req.body.status ?? 'active',
      createdByUserId: req.user!.userId,
      createdAt: now,
      updatedAt: now,
    });

    await settingsRepo.insert({
      tenantId,
      inviteAllowAllDomains: true,
      inviteAllowedDomains: '[]',
      emailSendConfigId: null,
      updatedAt: now,
      updatedByUserId: req.user!.userId,
    });

    if (req.body.initialAdminUserId) {
      const userRow = await userRepo.findOne({
        where: { id: req.body.initialAdminUserId },
        select: ['id']
      });

      if (userRow) {
        await membershipRepo.insert({
          id: generateId(),
          tenantId,
          userId: req.body.initialAdminUserId,
          role: 'tenant_admin',
          createdAt: now,
        });
      }
    }

    await logAudit({
      action: 'admin.tenant.create',
      userId: req.user!.userId,
      resourceType: 'tenant',
      resourceId: tenantId,
      details: { name: req.body.name, slug: req.body.slug },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ id: tenantId });
  } catch (error) {
    logger.error('Create tenant error:', error);
    throw Errors.internal('Failed to create tenant');
  }
}));

router.put('/:tenantId', apiLimiter, validateParams(tenantIdParamsSchema), validateBody(updateTenantSchema), asyncHandler(async (req, res) => {
  try {
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const now = Date.now();

    const existing = await tenantRepo.findOne({
      where: { id: req.params.tenantId },
      select: ['id']
    });

    if (!existing) {
      throw Errors.notFound('Tenant');
    }

    await tenantRepo.update({ id: req.params.tenantId }, {
      name: req.body.name,
      status: req.body.status,
      updatedAt: now,
    });

    await logAudit({
      action: 'admin.tenant.update',
      userId: req.user!.userId,
      resourceType: 'tenant',
      resourceId: req.params.tenantId,
      details: req.body,
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Update tenant error:', error);
    throw Errors.internal('Failed to update tenant');
  }
}));

// ============ Tenant Settings ============

router.get('/:tenantId/settings', apiLimiter, validateParams(tenantIdParamsSchema), asyncHandler(async (req, res) => {
  try {
    const dataSource = await getDataSource();
    const settingsRepo = dataSource.getRepository(TenantSettings);
    const row = await settingsRepo.findOne({ where: { tenantId: req.params.tenantId } });

    if (!row) {
      throw Errors.notFound('Tenant settings');
    }

    res.json({
      tenantId: row.tenantId,
      inviteAllowAllDomains: row.inviteAllowAllDomains,
      inviteAllowedDomains: (() => {
        try {
          return JSON.parse(String(row.inviteAllowedDomains || '[]'));
        } catch {
          return [];
        }
      })(),
      emailSendConfigId: row.emailSendConfigId,
      updatedAt: row.updatedAt,
      updatedByUserId: row.updatedByUserId,
    });
  } catch (error) {
    logger.error('Get tenant settings error:', error);
    throw Errors.internal('Failed to get tenant settings');
  }
}));

router.put(
  '/:tenantId/settings',
  validateParams(tenantIdParamsSchema),
  validateBody(updateTenantSettingsSchema),
  asyncHandler(async (req, res) => {
    try {
      const dataSource = await getDataSource();
      const settingsRepo = dataSource.getRepository(TenantSettings);
      const now = Date.now();

      const existing = await settingsRepo.findOne({
        where: { tenantId: req.params.tenantId },
        select: ['tenantId']
      });

      if (!existing) {
        throw Errors.notFound('Tenant settings');
      }

      await settingsRepo.update({ tenantId: req.params.tenantId }, {
        inviteAllowAllDomains: req.body.inviteAllowAllDomains,
        inviteAllowedDomains: req.body.inviteAllowedDomains ? JSON.stringify(req.body.inviteAllowedDomains) : undefined,
        emailSendConfigId: req.body.emailSendConfigId,
        updatedAt: now,
        updatedByUserId: req.user!.userId,
      });

      await logAudit({
        action: 'admin.tenant.settings.update',
        userId: req.user!.userId,
        resourceType: 'tenant_settings',
        resourceId: req.params.tenantId,
        details: req.body,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Update tenant settings error:', error);
      throw Errors.internal('Failed to update tenant settings');
    }
  })
);

// ============ Tenant Admins ============

router.get('/:tenantId/admins', apiLimiter, validateParams(tenantIdParamsSchema), asyncHandler(async (req, res) => {
  try {
    const dataSource = await getDataSource();
    const membershipRepo = dataSource.getRepository(TenantMembership);
    
    const result = await membershipRepo.createQueryBuilder('tm')
      .innerJoin(User, 'u', 'u.id = tm.userId')
      .where('tm.tenantId = :tenantId', { tenantId: req.params.tenantId })
      .andWhere('tm.role = :role', { role: 'tenant_admin' })
      .orderBy('u.email', 'ASC')
      .select([
        'tm.userId AS "userId"',
        'u.email AS email',
        'u.firstName AS "firstName"',
        'u.lastName AS "lastName"',
        'tm.role AS role',
        'tm.createdAt AS "createdAt"'
      ])
      .getRawMany();

    res.json(result);
  } catch (error) {
    logger.error('List tenant admins error:', error);
    throw Errors.internal('Failed to list tenant admins');
  }
}));

router.post('/:tenantId/admins', apiLimiter, validateParams(tenantIdParamsSchema), validateBody(tenantAdminBodySchema), asyncHandler(async (req, res) => {
  try {
    const dataSource = await getDataSource();
    const tenantRepo = dataSource.getRepository(Tenant);
    const userRepo = dataSource.getRepository(User);
    const membershipRepo = dataSource.getRepository(TenantMembership);
    const now = Date.now();

    const tenantRow = await tenantRepo.findOne({
      where: { id: req.params.tenantId },
      select: ['id']
    });
    if (!tenantRow) throw Errors.notFound('Tenant');

    const userRow = await userRepo.findOne({
      where: { id: req.body.userId },
      select: ['id']
    });
    if (!userRow) throw Errors.notFound('User');

    const existing = await membershipRepo.findOne({
      where: { tenantId: req.params.tenantId, userId: req.body.userId },
      select: ['id']
    });

    if (!existing) {
      await membershipRepo.insert({
        id: generateId(),
        tenantId: req.params.tenantId,
        userId: req.body.userId,
        role: 'tenant_admin',
        createdAt: now,
      });
    } else {
      await membershipRepo.update(
        { tenantId: req.params.tenantId, userId: req.body.userId },
        { role: 'tenant_admin' }
      );
    }

    await logAudit({
      action: 'admin.tenant.admin.assign',
      userId: req.user!.userId,
      resourceType: 'tenant',
      resourceId: req.params.tenantId,
      details: { tenantId: req.params.tenantId, userId: req.body.userId },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Assign tenant admin error:', error);
    throw Errors.internal('Failed to assign tenant admin');
  }
}));

router.delete('/:tenantId/admins/:userId', apiLimiter, validateParams(tenantAdminParamsSchema), asyncHandler(async (req, res) => {
  try {
    const dataSource = await getDataSource();
    const membershipRepo = dataSource.getRepository(TenantMembership);

    const existing = await membershipRepo.findOne({
      where: { tenantId: req.params.tenantId, userId: req.params.userId },
      select: ['id']
    });

    if (!existing) {
      throw Errors.notFound('Tenant membership');
    }

    await membershipRepo.update(
      { tenantId: req.params.tenantId, userId: req.params.userId },
      { role: 'member' }
    );

    await logAudit({
      action: 'admin.tenant.admin.revoke',
      userId: req.user!.userId,
      resourceType: 'tenant',
      resourceId: req.params.tenantId,
      details: { tenantId: req.params.tenantId, userId: req.params.userId },
      ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Revoke tenant admin error:', error);
    throw Errors.internal('Failed to revoke tenant admin');
  }
}));

export default router;
