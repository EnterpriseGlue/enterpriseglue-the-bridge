import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import tenantsRouter from '../../../../src/modules/platform-admin/routes/tenants.js';
import { getDataSource } from '../../../../src/shared/db/data-source.js';
import { Tenant } from '../../../../src/shared/db/entities/Tenant.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/services/audit.js', () => ({
  logAudit: vi.fn(),
}));

describe('platform-admin tenants routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(tenantsRouter);
    vi.clearAllMocks();

    const tenantRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue({ id: 't1', slug: 'test-tenant' }),
      save: vi.fn().mockResolvedValue({ id: 't1', slug: 'test-tenant' }),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === Tenant) return tenantRepo;
        return { find: vi.fn().mockResolvedValue([]), findOne: vi.fn(), save: vi.fn() };
      },
    });
  });

  it('placeholder test for tenants routes', () => {
    expect(true).toBe(true);
  });
});
