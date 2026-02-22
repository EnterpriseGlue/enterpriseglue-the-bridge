import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import loginRouter from '../../../../src/modules/auth/routes/login.js';
import { getDataSource } from '../../../../src/shared/db/data-source.js';
import { User } from '../../../../src/shared/db/entities/User.js';
import { SsoProvider } from '../../../../src/shared/db/entities/SsoProvider.js';
import { errorHandler } from '../../../../src/shared/middleware/errorHandler.js';
import { verifyPassword } from '@shared/utils/password.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/utils/password.js', () => ({
  verifyPassword: vi.fn().mockResolvedValue(false),
}));

vi.mock('@shared/utils/jwt.js', () => ({
  generateAccessToken: vi.fn().mockReturnValue('access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
}));

vi.mock('@shared/services/audit.js', () => ({
  logAudit: vi.fn(),
  AuditActions: {
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  },
}));

vi.mock('@shared/middleware/rateLimiter.js', () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
  engineLimiter: (_req: any, _res: any, next: any) => next(),
}));

describe('auth login routes', () => {
  let app: express.Application;
  let userRepo: {
    createQueryBuilder: Mock;
    update: Mock;
    insert: Mock;
  };
  let ssoProviderRepo: {
    count: Mock;
  };

  beforeEach(() => {
    app = express();
    app.disable('x-powered-by');
    app.use(express.json());
    app.use(loginRouter);
    app.use(errorHandler);
    vi.clearAllMocks();

    userRepo = {
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      }),
      update: vi.fn(),
      insert: vi.fn(),
    };

    ssoProviderRepo = {
      count: vi.fn().mockResolvedValue(0),
    };

    const refreshTokenRepo = {
      insert: vi.fn(),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === User) return userRepo;
        if (entity === SsoProvider) return ssoProviderRepo;
        return refreshTokenRepo;
      },
    });
  });

  it('blocks local login when SSO policy is active', async () => {
    ssoProviderRepo.count.mockResolvedValue(1);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Local login is disabled. Please use your SSO provider.');
    expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('blocks local login for non-local accounts', async () => {
    ssoProviderRepo.count.mockResolvedValue(0);
    const getOne = vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      authProvider: 'microsoft',
      passwordHash: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isEmailVerified: true,
      platformRole: 'user',
      createdByUserId: null,
    });
    userRepo.createQueryBuilder.mockReturnValue({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getOne,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Local login is disabled for this account. Please use SSO.');
    expect(verifyPassword as unknown as Mock).not.toHaveBeenCalled();
  });
});
