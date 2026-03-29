/**
 * RefreshTokenService
 * Handles refresh token lifecycle: creation, validation, and revocation.
 */

import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { RefreshToken } from '@enterpriseglue/shared/infrastructure/persistence/entities/RefreshToken.js';
import { IsNull, MoreThan } from 'typeorm';
import { generateId } from '@enterpriseglue/shared/utils/id.js';
import bcrypt from 'bcryptjs';

class RefreshTokenServiceImpl {
  /**
   * Store a new refresh token (hashed) for a user.
   */
  async store(input: {
    userId: string;
    rawToken: string;
    expiresInMs?: number;
    deviceInfo?: { userAgent?: string; ip?: string };
  }): Promise<void> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(RefreshToken);
    const tokenHash = await bcrypt.hash(input.rawToken, 10);
    const expiresAt = Date.now() + (input.expiresInMs ?? 7 * 24 * 60 * 60 * 1000);

    await repo.insert({
      id: generateId(),
      userId: input.userId,
      tokenHash,
      expiresAt,
      createdAt: Date.now(),
      deviceInfo: input.deviceInfo ? JSON.stringify(input.deviceInfo) : null,
    });
  }

  /**
   * Validate a raw refresh token against stored hashes for a user.
   * Returns true if any non-revoked, non-expired token matches.
   */
  async validate(userId: string, rawToken: string): Promise<boolean> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(RefreshToken);

    const candidates = await repo.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(Date.now()),
      },
      select: ['tokenHash'],
    });

    for (const row of candidates) {
      const isMatch = await bcrypt.compare(rawToken, row.tokenHash);
      if (isMatch) return true;
    }

    return false;
  }

  /**
   * Revoke all non-revoked refresh tokens for a user.
   */
  async revokeAll(userId: string): Promise<void> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(RefreshToken);
    await repo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: Date.now() },
    );
  }

  /**
   * Revoke all refresh tokens for a user (including already-revoked ones — belt-and-suspenders).
   */
  async revokeAllForce(userId: string): Promise<void> {
    const dataSource = await getDataSource();
    const repo = dataSource.getRepository(RefreshToken);
    await repo.update(
      { userId },
      { revokedAt: Date.now() },
    );
  }
}

export const refreshTokenService = new RefreshTokenServiceImpl();
