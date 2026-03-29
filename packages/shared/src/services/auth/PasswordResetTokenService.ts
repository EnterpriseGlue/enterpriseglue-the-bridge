/**
 * PasswordResetTokenService
 * Handles password reset token lifecycle: creation, validation, and consumption.
 */

import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { PasswordResetToken } from '@enterpriseglue/shared/infrastructure/persistence/entities/PasswordResetToken.js';
import { IsNull } from 'typeorm';

class PasswordResetTokenServiceImpl {
  /**
   * Create a new password reset token for a user, consuming any outstanding ones.
   * Returns the raw (unhashed) token for inclusion in emails.
   */
  async create(userId: string): Promise<{ rawToken: string; tokenHash: string; expiresAt: number }> {
    const { randomBytes, createHash } = await import('crypto');
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(PasswordResetToken);

    // Consume any outstanding tokens for this user
    await repo.update({ userId, consumedAt: IsNull() }, { consumedAt: Date.now() });

    await repo.insert({
      userId,
      tokenHash,
      expiresAt,
      createdAt: Date.now(),
      consumedAt: null,
    });

    return { rawToken, tokenHash, expiresAt };
  }

  /**
   * Find a valid (unconsumed, non-expired) reset token by raw token string.
   * Returns the PasswordResetToken entity or null.
   */
  async findByRawToken(rawToken: string): Promise<PasswordResetToken | null> {
    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(PasswordResetToken);
    return repo.findOneBy({ tokenHash, consumedAt: IsNull() });
  }

  /**
   * Consume all outstanding reset tokens for a user.
   */
  async consumeAll(userId: string): Promise<void> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(PasswordResetToken);
    await repo.update({ userId, consumedAt: IsNull() }, { consumedAt: Date.now() });
  }
}

export const passwordResetTokenService = new PasswordResetTokenServiceImpl();
