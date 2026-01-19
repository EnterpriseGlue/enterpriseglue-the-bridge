import type { Request, Response, NextFunction } from 'express';
import { Errors } from './errorHandler.js';
import { getDataSource } from '@shared/db/data-source.js';
import { Engine } from '@shared/db/entities/Engine.js';
import { engineService } from '../services/platform-admin/index.js';
import type { EngineRole } from '@shared/constants/roles.js';
import { isPlatformAdmin } from './platformAuth.js';

async function getActiveEngineId(): Promise<string | null> {
  const dataSource = await getDataSource();
  const engineRepo = dataSource.getRepository(Engine);
  const engine = await engineRepo.findOne({
    where: { active: true },
    select: ['id'],
  });
  return engine?.id ? String(engine.id) : null;
}

function requireActiveEngineRole(allowedRoles: EngineRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw Errors.unauthorized('Authentication required');
      if (isPlatformAdmin(req)) return next();

      const engineId = await getActiveEngineId();
      if (!engineId) return res.status(503).json({ error: 'No active engine configured' });

      const role = await engineService.getEngineRole(req.user.userId, engineId);
      if (!role || !allowedRoles.includes(role)) {
        throw Errors.forbidden('Access denied');
      }

      (req as any).activeEngineId = engineId;
      (req as any).activeEngineRole = role;

      next();
    } catch (e: any) {
      if (e instanceof Error) {
        return next(e);
      }
      return next(Errors.internal('Authorization failed'));
    }
  };
}

export function requireActiveEngineAccess() {
  return requireActiveEngineRole(['owner', 'delegate', 'deployer', 'viewer']);
}

export function requireActiveEngineDeployer() {
  return requireActiveEngineRole(['owner', 'delegate', 'deployer']);
}

export function requireActiveEngineReadOrWrite() {
  return (req: Request, res: Response, next: NextFunction) => {
    const method = String(req.method || 'GET').toUpperCase();
    const path = String(req.path || '');
    const readLikeNonGet =
      path === '/mission-control-api/process-instances/preview-count' ||
      path === '/mission-control-api/migration/preview' ||
      path === '/mission-control-api/migration/plan/generate' ||
      path === '/mission-control-api/migration/plan/validate' ||
      path === '/mission-control-api/migration/active-sources' ||
      (path.startsWith('/mission-control-api/decision-definitions/') && path.endsWith('/evaluate'));

    const isRead = method === 'GET' || readLikeNonGet;
    const mw = isRead ? requireActiveEngineAccess() : requireActiveEngineDeployer();
    return mw(req, res, next);
  };
}

export function requireActiveEngineManager() {
  return requireActiveEngineRole(['owner', 'delegate']);
}
