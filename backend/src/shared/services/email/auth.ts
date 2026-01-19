import { logger } from '@shared/utils/logger.js';
import { getResendClient } from './config.js';
import {
  getWelcomeEmailHtml,
  getWelcomeEmailText,
  getVerificationEmailHtml,
  getVerificationEmailText,
} from './default-templates.js';

export interface WelcomeEmailParams {
  to: string;
  firstName?: string;
  temporaryPassword: string;
  loginUrl?: string;
}

/**
 * Send welcome email to new user with temporary password
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();

  if (!client) {
    logger.warn(`⚠️  Would send welcome email to ${params.to} (email disabled)`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { to, firstName, temporaryPassword, loginUrl = 'http://localhost:5173/login' } = params;

    const result = await client.emails.send({
      from: 'Voyager <onboarding@resend.dev>',
      to: [to],
      subject: 'Welcome to Voyager - Your Account Details',
      html: getWelcomeEmailHtml({ to, firstName, temporaryPassword, loginUrl }),
      text: getWelcomeEmailText({ to, firstName, temporaryPassword, loginUrl }),
    });

    if (result.error) {
      logger.error('❌ Failed to send email:', result.error);
      return { success: false, error: result.error.message };
    }

    logger.info(`✅ Welcome email sent to ${to} (ID: ${result.data?.id})`);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export interface VerificationEmailParams {
  to: string;
  firstName?: string;
  verificationUrl: string;
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(params: VerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();

  if (!client) {
    logger.warn(`⚠️  Would send verification email to ${params.to} (email disabled)`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { to, firstName, verificationUrl } = params;

    const result = await client.emails.send({
      from: 'Voyager <onboarding@resend.dev>',
      to: [to],
      subject: 'Verify Your Email - Voyager',
      html: getVerificationEmailHtml({ firstName, verificationUrl }),
      text: getVerificationEmailText({ firstName, verificationUrl }),
    });

    if (result.error) {
      logger.error('❌ Failed to send verification email:', result.error);
      return { success: false, error: result.error.message };
    }

    logger.info(`✅ Verification email sent to ${to} (ID: ${result.data?.id})`);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error sending verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
