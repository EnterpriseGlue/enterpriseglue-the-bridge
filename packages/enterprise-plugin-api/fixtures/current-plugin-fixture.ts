/**
 * Lightweight compatibility fixture for the current plugin-api contract.
 *
 * Keep this example aligned with:
 * - ../src/frontend.d.ts
 * - ../src/backend.d.ts
 */

export const frontendPluginFixture = {
  routes: [{ path: '/enterprise' }],
  tenantRoutes: [{ path: '/t/:tenantSlug/enterprise' }],
  navItems: [{ id: 'enterprise-nav', label: 'Enterprise', path: '/enterprise' }],
  menuItems: [{ id: 'enterprise-menu', label: 'Enterprise' }],
  componentOverrides: [{ name: 'engines-page', component: () => null }],
  featureOverrides: [{ flag: 'multiTenant', enabled: true }],
};

export const backendPluginFixture = {
  registerRoutes: async () => undefined,
  migrateEnterpriseDatabase: async () => undefined,
};

export const backendContextFixture = {
  connectionPool: {
  async query() {
    return { rows: [], rowCount: 0 };
  },
  async close() {
    return;
  },
  getNativePool() {
    return {};
  },
  },
  config: {},
};
