import { Router } from 'express';
import { logger } from '@shared/utils/logger.js';
import { z } from 'zod';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { getDataSource } from '@shared/db/data-source.js';
import { User } from '@shared/db/entities/User.js';
import { MoreThan } from 'typeorm';
import { validateBody } from '@shared/middleware/validate.js';

const router = Router();

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

/**
 * GET /api/auth/verify-email
 * Verify user's email address using token from email
 */
router.get('/api/auth/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    throw Errors.validation('Verification token is required');
  }

  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);
  const now = Date.now();

  // Find user with this token
  const user = await userRepo.findOne({
    where: {
      emailVerificationToken: token,
      emailVerificationTokenExpiry: MoreThan(now),
    },
  });

  if (!user) {
    throw Errors.validation('Invalid or expired verification token');
  }

  // Check if already verified
  if (user.isEmailVerified) {
    return res.json({ 
      message: 'Email already verified',
      alreadyVerified: true 
    });
  }

  // Update user - mark email as verified and clear token
  await userRepo.update({ id: user.id }, {
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiry: null,
    updatedAt: now
  });

  res.json({ 
    message: 'Email verified successfully',
    success: true 
  });
}));

/**
 * POST /api/auth/resend-verification
 * Resend verification email to user
 */
router.post('/api/auth/resend-verification', validateBody(resendVerificationSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    throw Errors.validation('Email is required');
  }

  const dataSource = await getDataSource();
  const userRepo = dataSource.getRepository(User);

  // Find user by email
  const emailLower = email.toLowerCase();
  const user = await userRepo.findOneBy({ email: emailLower });

  if (!user) {
    // Don't reveal if email exists or not (security)
    return res.json({ message: 'If the email exists, a verification link has been sent' });
  }

  // Check if already verified
  if (user.isEmailVerified) {
    return res.json({ 
      message: 'Email is already verified',
      alreadyVerified: true 
    });
  }

  // Generate new verification token
  const { randomBytes } = await import('crypto');
  const verificationToken = randomBytes(32).toString('hex');
  const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Update user with new token
  await userRepo.update({ id: user.id }, {
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiry: tokenExpiry,
    updatedAt: Date.now()
  });

  // Send verification email
  const { sendVerificationEmail } = await import('@shared/services/email/index.js');
  const { config } = await import('@shared/config/index.js');
  
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
  
  await sendVerificationEmail({
    to: user.email,
    firstName: user.firstName || undefined,
    verificationUrl,
  });

  res.json({ message: 'If the email exists, a verification link has been sent' });
}));

export default router;
