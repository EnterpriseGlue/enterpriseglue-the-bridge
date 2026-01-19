import { Request, Response, NextFunction } from 'express';
import { Errors } from './errorHandler.js';
import { config } from '@shared/config/index.js';
import { getDataSource } from '@shared/db/data-source.js';
import { Tenant } from '@shared/db/entities/Tenant.js';
import { TenantMembership } from '@shared/db/entities/TenantMembership.js';
import { logger } from '@shared/utils/logger.js';

export type TenantRole = 'tenant_admin' | 'member';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      tenantRole?: TenantRole;
    }
  }
}

function extractTenantSlug(req: Request): string | null {
  const fromParams = (req.params as any)?.tenantSlug;
  if (typeof fromParams === 'string' && fromParams.trim()) return fromParams.trim();

  const header = req.headers['x-tenant-slug'];
  if (typeof header === 'string' && header.trim()) return header.trim();

  const url = String(req.originalUrl || req.url || '');
  const match = url.match(/^\/t\/([^/?#]+)(?:[/?#]|$)/);
  if (match?.[1]) return decodeURIComponent(match[1]);

  return null;
}

export function resolveTenantContext(options?: { required?: boolean }) {
  const required = options?.required ?? true;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantSlug = extractTenantSlug(req) || (!config.multiTenant ? 'default' : null);
      if (!tenantSlug) {
        if (!required) return next();
        throw Errors.validation('Tenant context missing (expected tenantSlug)');
      }

      const dataSource = await getDataSource();
      const tenantRepo = dataSource.getRepository(Tenant);
      const t = await tenantRepo.findOneBy({ slug: tenantSlug });

      if (!t) {
        throw Errors.tenantNotFound();
      }

      req.tenant = { tenantId: t.id, tenantSlug: t.slug };
      next();
    } catch (error) {
      logger.error('Tenant context resolution error', { error });
      throw Errors.internal('Failed to resolve tenant context');
    }
  };
}

export function requireTenantRole(...allowedRoles: TenantRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw Errors.unauthorized('Authentication required');
      }

      if (req.user.platformRole === 'admin') {
        return next();
      }

      if (!req.tenant) {
        throw Errors.validation('Tenant context missing');
      }

      const dataSource = await getDataSource();
      const membershipRepo = dataSource.getRepository(TenantMembership);
      const membership = await membershipRepo.findOneBy({
        tenantId: req.tenant.tenantId,
        userId: req.user.userId,
      });

      const role = membership?.role as TenantRole | undefined;
      if (!role) {
        throw Errors.forbidden('Tenant membership required');
      }

      req.tenantRole = role;

      if (!allowedRoles.includes(role)) {
        throw Errors.forbidden('Insufficient tenant permissions');
      }

      next();
    } catch (error) {
      logger.error('Tenant role authorization error', { error });
      throw Errors.internal('Tenant authorization check failed');
    }
  };
}

/**
 * Convenience middleware: require tenant admin or platform admin
 * Combines resolveTenantContext + requireTenantRole('tenant_admin')
 */
export const requireTenantAdmin = requireTenantRole('tenant_admin');

/**
 * Helper function to check tenant admin authorization (for use inside route handlers)
 * Returns true if authorized, throws if not
 */
export async function checkTenantAdmin(req: Request, tenantId: string): Promise<boolean> {
  if (!req.user) {
    throw Errors.unauthorized('Authentication required');
  }

  // Platform admins can access any tenant
  if (req.user.platformRole === 'admin') {
    return true;
  }

  const dataSource = await getDataSource();
  const membershipRepo = dataSource.getRepository(TenantMembership);
  const membership = await membershipRepo.findOne({
    where: { tenantId, userId: req.user.userId },
    select: ['role']
  });

  if (!membership || membership.role !== 'tenant_admin') {
    throw Errors.forbidden('Only tenant admins can perform this action');
  }

  return true;
}
