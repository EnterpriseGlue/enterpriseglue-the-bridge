import { logger } from '@shared/utils/logger.js';
import { getResendClient } from './config.js';

export interface ContactAdminParams {
  userEmail: string;
  subject: string;
  message: string;
}

/**
 * Send contact admin email from login page
 */
export async function sendContactAdminEmail(params: ContactAdminParams): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();

  if (!client) {
    logger.warn(`⚠️  Would send contact admin email from ${params.userEmail} (email disabled)`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { userEmail, subject, message } = params;

    const result = await client.emails.send({
      from: 'Voyager <technical@enterpriseglue.ai>',
      to: ['amankejriwal@gmail.com'],
      replyTo: userEmail,
      subject: `[Voyager Support] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1c1b1d; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0; font-size: 20px;">📧 Voyager Support Request</h2>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <div style="background: white; border-left: 4px solid #1c1b1d; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #666;">From:</p>
                <p style="margin: 5px 0 15px 0; font-size: 16px; font-weight: 600;">${userEmail}</p>
                
                <p style="margin: 0; font-size: 14px; color: #666;">Subject:</p>
                <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">${subject}</p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 4px; border: 1px solid #e0e0e0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; font-weight: 600;">Message:</p>
                <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${message || '(No message provided)'}</p>
              </div>
              
              <p style="font-size: 12px; color: #999; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                This email was sent from the Voyager login page contact form.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Voyager Support Request

From: ${userEmail}
Subject: ${subject}

Message:
${message || '(No message provided)'}

---
This email was sent from the Voyager login page contact form.
      `.trim(),
    });

    if (result.error) {
      logger.error('❌ Failed to send contact admin email:', result.error);
      return { success: false, error: result.error.message };
    }

    logger.info(`✅ Contact admin email sent from ${userEmail} (ID: ${result.data?.id})`);
    return { success: true };
  } catch (error) {
    logger.error('❌ Error sending contact admin email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
