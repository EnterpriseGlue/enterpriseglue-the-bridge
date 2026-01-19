import { describe, it, expect } from 'vitest';
import * as routes from '../../../src/routes/index';

describe('frontend routes index', () => {
  it('exports route helpers', () => {
    expect(routes).toHaveProperty('createAppRoutes');
    expect(routes).toHaveProperty('createRootLayoutRoute');
    expect(routes).toHaveProperty('createTenantLayoutRoute');
  });

  it('builds protected child routes with correct path prefixes', () => {
    const rootRoutes = routes.createProtectedChildRoutes(true);
    const tenantRoutes = routes.createProtectedChildRoutes(false);

    expect(rootRoutes.find((r) => r.path === '/admin/settings')).toBeDefined();
    expect(tenantRoutes.find((r) => r.path === 'admin/settings')).toBeDefined();
  });
});
