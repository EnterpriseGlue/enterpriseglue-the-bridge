import type { EnterpriseBackendPlugin } from '@enterpriseglue/enterprise-plugin-api/backend';

const noopPlugin: EnterpriseBackendPlugin = {};

function isEnterpriseEnabled(): boolean {
  const raw = String(process.env.ENTERPRISE_ENABLED || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

async function dynamicImport(specifier: string): Promise<any> {
  const importer = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
  return importer(specifier);
}

export async function loadEnterpriseBackendPlugin(): Promise<EnterpriseBackendPlugin> {
  if (!isEnterpriseEnabled()) return noopPlugin;

  try {
    const mod = await dynamicImport('@enterpriseglue/enterprise-backend');
    const plugin = mod?.default ?? mod?.enterpriseBackendPlugin ?? mod?.plugin ?? mod;

    if (plugin && typeof plugin === 'object') {
      return plugin as EnterpriseBackendPlugin;
    }

    return noopPlugin;
  } catch {
    return noopPlugin;
  }
}
