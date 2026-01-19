import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  resolveTenantContext,
  requireTenantRole,
  checkTenantAdmin,
} from '../../../src/shared/middleware/tenant.js';
import { Errors } from '../../../src/shared/middleware/errorHandler.js';
import { getDataSource } from '../../../src/shared/db/data-source.js';
import { Tenant } from '../../../src/shared/db/entities/Tenant.js';
import { TenantMembership } from '../../../src/shared/db/entities/TenantMembership.js';

vi.mock('@shared/config/index.js', () => ({
  config: { multiTenant: false },
}));

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('tenant middleware', () => {
  let req: any;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
      headers: {},
      originalUrl: '/api/test',
      user: { userId: 'user-1', platformRole: 'user' },
    };
    res = {};
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('resolves tenant context from default when multiTenant disabled', async () => {
    const tenantRepo = { findOneBy: vi.fn().mockResolvedValue({ id: 't1', slug: 'default' }) };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === Tenant) return tenantRepo;
        throw new Error('Unexpected repository');
      },
    });

    await resolveTenantContext()(req as Request, res as Response, next);

    expect(req.tenant).toEqual({ tenantId: 't1', tenantSlug: 'default' });
    expect(next).toHaveBeenCalled();
  });

  it('requires tenant role for members', async () => {
    const membershipRepo = { findOneBy: vi.fn().mockResolvedValue({ role: 'tenant_admin' }) };
    req.tenant = { tenantId: 't1', tenantSlug: 'default' };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === TenantMembership) return membershipRepo;
        throw new Error('Unexpected repository');
      },
    });

    const middleware = requireTenantRole('tenant_admin');
    await middleware(req as Request, res as Response, next);

    expect(req.tenantRole).toBe('tenant_admin');
    expect(next).toHaveBeenCalled();
  });

  it('allows platform admin without tenant membership', async () => {
    req.user = { userId: 'admin-1', platformRole: 'admin' };

    const middleware = requireTenantRole('tenant_admin');
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('checkTenantAdmin allows platform admin', async () => {
    req.user = { userId: 'admin-1', platformRole: 'admin' };

    const result = await checkTenantAdmin(req as Request, 't1');
    expect(result).toBe(true);
  });

  it('checkTenantAdmin rejects non-admin members', async () => {
    req.user = { userId: 'user-1', platformRole: 'user' };
    const membershipRepo = { findOne: vi.fn().mockResolvedValue({ role: 'member' }) };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === TenantMembership) return membershipRepo;
        throw new Error('Unexpected repository');
      },
    });

    await expect(checkTenantAdmin(req as Request, 't1')).rejects.toEqual(
      Errors.forbidden('Only tenant admins can perform this action')
    );
  });
});
