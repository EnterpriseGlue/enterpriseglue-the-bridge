import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import logoutRouter from '../../../../src/modules/auth/routes/logout.js';
import { getDataSource } from '../../../../src/shared/db/data-source.js';
import { RefreshToken } from '../../../../src/shared/db/entities/RefreshToken.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', type: 'access', platformRole: 'user' };
    next();
  },
}));

describe('POST /api/auth/logout', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.disable('x-powered-by');
    app.use(express.json());
    app.use(logoutRouter);
    vi.clearAllMocks();
  });

  it('revokes all refresh tokens when no token provided', async () => {
    const refreshTokenRepo = { update: vi.fn() };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === RefreshToken) return refreshTokenRepo;
        throw new Error('Unexpected repository');
      },
    });

    const response = await request(app).post('/api/auth/logout').send({});

    expect(response.status).toBe(200);
    expect(refreshTokenRepo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({ revokedAt: expect.any(Number) })
    );
  });

  it('revokes active tokens when refresh token provided', async () => {
    const refreshTokenRepo = { update: vi.fn() };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === RefreshToken) return refreshTokenRepo;
        throw new Error('Unexpected repository');
      },
    });

    const response = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'refresh-1' });

    expect(response.status).toBe(200);
    expect(refreshTokenRepo.update).toHaveBeenCalled();
  });
});
