import type { ComponentType } from 'react';

export type EnterpriseRoute = {
  path?: string;
  index?: boolean;
  element?: unknown;
  children?: EnterpriseRoute[];
};

export interface ComponentOverride {
  /** Stable extension point name (for example: `engines-page`). */
  name: string;
  /** UI component rendered by the host at the named extension point. */
  component: ComponentType<Record<string, unknown>>;
}

export interface FeatureOverride {
  /** Host feature flag identifier (for example: `multiTenant`). */
  flag: string;
  enabled: boolean;
}

export type EnterpriseNavItem = Record<string, unknown>;
export type EnterpriseMenuItem = Record<string, unknown>;

export interface EnterpriseFrontendPlugin {
  routes?: EnterpriseRoute[];
  tenantRoutes?: EnterpriseRoute[];
  navItems?: EnterpriseNavItem[];
  menuItems?: EnterpriseMenuItem[];
  componentOverrides?: ComponentOverride[];
  featureOverrides?: FeatureOverride[];
  /** @deprecated Unsupported by OSS host; keep EE UI slot extensions in `componentOverrides`. */
  headerSlots?: never;
  /** @deprecated Unsupported by OSS host; use `navItems` instead. */
  sidebarItems?: never;
}
