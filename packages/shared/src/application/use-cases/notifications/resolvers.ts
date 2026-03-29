import type { TenantResolver, TenantContext } from './types.js';

export class DefaultTenantResolver implements TenantResolver {
  resolve({ req, user, query }: Parameters<TenantResolver['resolve']>[0]): TenantContext {
    if (!user) {
      throw new Error('User context required');
    }
    
    // OSS: tenant from query param or header (soft multi-tenancy)
    const tenantId = query?.tenantId || 
                    req?.headers['x-tenant-id'] as string || 
                    null;
    
    return { 
      tenantId, 
      userId: user.userId 
    };
  }
}
