import { Router, Request, Response } from 'express';
import { logger } from '@shared/utils/logger.js';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { getDataSource } from '@shared/db/data-source.js';
import { User } from '@shared/db/entities/User.js';
import { Tenant } from '@shared/db/entities/Tenant.js';
import { TenantSettings } from '@shared/db/entities/TenantSettings.js';
import { TenantMembership } from '@shared/db/entities/TenantMembership.js';
import { generateId } from '@shared/utils/id.js';
import { hashPassword } from '@shared/utils/password.js';
import { logAudit, AuditActions } from '@shared/services/audit.js';
import { config } from '@shared/config/index.js';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { apiLimiter } from '@shared/middleware/rateLimiter.js';
import { sendVerificationEmail } from '@shared/services/email/index.js';
import { validateBody, validateQuery } from '@shared/middleware/validate.js';

const router = Router();

const signupSchema = z.object({
  tenantName: z.string().min(1).max(200),
  tenantSlug: z.string().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

const checkSlugSchema = z.object({
  slug: z.string().min(2).max(60),
});

router.get('/api/auth/signup/check-slug', validateQuery(checkSlugSchema), asyncHandler(async (req: Request, res: Response) => {
  const slug = req.query.slug as string;
  
  const dataSource = await getDataSource();
  const tenantRepo = dataSource.getRepository(Tenant);
  const existing = await tenantRepo.findOneBy({ slug: slug.toLowerCase() });

  res.json({ available: !existing });
}));

router.post('/api/auth/signup', apiLimiter, validateBody(signupSchema), asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const dataSource = await getDataSource();
  const tenantRepo = dataSource.getRepository(Tenant);
  const tenantSettingsRepo = dataSource.getRepository(TenantSettings);
  const userRepo = dataSource.getRepository(User);
  const membershipRepo = dataSource.getRepository(TenantMembership);
  const now = Date.now();

  const existingTenant = await tenantRepo.findOneBy({ slug: body.tenantSlug.toLowerCase() });

  if (existingTenant) {
    return res.status(409).json({ error: 'Tenant slug already exists' });
  }

  const existingUser = await userRepo.createQueryBuilder('u')
    .where('LOWER(u.email) = LOWER(:email)', { email: body.email })
    .getOne();

  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const tenantId = generateId();
  const userId = generateId();
  const passwordHash = await hashPassword(body.password);

  await tenantRepo.insert({
    id: tenantId,
    name: body.tenantName,
    slug: body.tenantSlug.toLowerCase(),
    status: 'active',
    createdByUserId: userId,
    createdAt: now,
    updatedAt: now,
  });

  await tenantSettingsRepo.insert({
    tenantId,
    inviteAllowAllDomains: false,
    inviteAllowedDomains: JSON.stringify([body.email.split('@')[1]]),
    emailSendConfigId: null,
    updatedAt: now,
    updatedByUserId: userId,
  });

  const verificationToken = randomBytes(32).toString('hex');
  const tokenExpiry = now + 24 * 60 * 60 * 1000; // 24 hours

  await userRepo.insert({
    id: userId,
    email: body.email.toLowerCase(),
    passwordHash,
    firstName: body.firstName,
    lastName: body.lastName,
    platformRole: 'user',
    isActive: true,
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiry: tokenExpiry,
    mustResetPassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    createdByUserId: null,
  });

  await membershipRepo.insert({
    id: generateId(),
    tenantId,
    userId,
    role: 'tenant_admin',
    createdAt: now,
  });

  const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
  
  try {
    await sendVerificationEmail({
      to: body.email.toLowerCase(),
      firstName: body.firstName,
      verificationUrl,
    });
  } catch (emailError) {
    logger.error('Failed to send verification email:', emailError);
  }

  await logAudit({
    tenantId,
    action: AuditActions.SIGNUP_SUCCESS,
    userId,
    resourceType: 'tenant',
    resourceId: tenantId,
    details: { tenantName: body.tenantName, tenantSlug: body.tenantSlug, requiresVerification: true },
    ipAddress: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    requiresVerification: true,
    email: body.email.toLowerCase(),
    tenant: {
      id: tenantId,
      name: body.tenantName,
      slug: body.tenantSlug.toLowerCase(),
    },
  });
}));

export default router;
