import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import tenantAdminRouter from '../../../../src/modules/admin/routes/tenant-admin.js';
import { getDataSource } from '../../../../src/shared/db/data-source.js';
import { TenantMembership } from '../../../../src/shared/db/entities/TenantMembership.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

vi.mock('@shared/middleware/tenant.js', () => ({
  resolveTenantContext: () => (req: any, _res: any, next: any) => {
    req.tenant = { tenantId: 'tenant-1' };
    next();
  },
  requireTenantRole: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@shared/services/audit.js', () => ({
  logAudit: vi.fn(),
}));

describe('GET /users', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(tenantAdminRouter);
    vi.clearAllMocks();
  });

  it('lists tenant users', async () => {
    const membershipRepo = {
      createQueryBuilder: vi.fn(() => ({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { userId: 'u1', email: 'user@example.com', role: 'member' },
        ]),
      })),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === TenantMembership) return membershipRepo;
        throw new Error('Unexpected repository');
      },
    });

    const response = await request(app).get('/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});
