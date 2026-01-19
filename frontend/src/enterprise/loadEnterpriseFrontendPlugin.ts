import type { EnterpriseFrontendPlugin } from '@enterpriseglue/enterprise-plugin-api/frontend';

const emptyPlugin: EnterpriseFrontendPlugin = { routes: [], tenantRoutes: [], navItems: [], menuItems: [] };

function isEnterpriseEnabled(): boolean {
  const raw = String((import.meta as any).env?.VITE_ENTERPRISE_ENABLED || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

async function dynamicImport(specifier: string): Promise<any> {
  const importer = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
  return importer(specifier);
}

let cached: Promise<EnterpriseFrontendPlugin> | null = null;

export async function loadEnterpriseFrontendPlugin(): Promise<EnterpriseFrontendPlugin> {
  if (!isEnterpriseEnabled()) return emptyPlugin;

  try {
    const mod = await dynamicImport('@enterpriseglue/enterprise-frontend');
    const plugin = mod?.default ?? mod?.enterpriseFrontendPlugin ?? mod?.plugin ?? mod;

    if (plugin && typeof plugin === 'object') {
      return {
        routes: Array.isArray(plugin.routes) ? plugin.routes : [],
        tenantRoutes: Array.isArray(plugin.tenantRoutes) ? plugin.tenantRoutes : [],
        navItems: Array.isArray(plugin.navItems) ? plugin.navItems : [],
        menuItems: Array.isArray(plugin.menuItems) ? plugin.menuItems : [],
      };
    }

    return emptyPlugin;
  } catch {
    return emptyPlugin;
  }
}

export function getEnterpriseFrontendPlugin(): Promise<EnterpriseFrontendPlugin> {
  if (!cached) {
    cached = loadEnterpriseFrontendPlugin();
  }
  return cached;
}
