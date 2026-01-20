import { Router, Request, Response } from 'express';
import { apiLimiter } from '@shared/middleware/rateLimiter.js';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { validateQuery } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import {
  listDeployments,
  fetchDeploymentById,
  removeDeployment,
  fetchProcessDefinitionDiagram,
} from '../services/deployments-service.js';
import { DeploymentQueryParams } from '@shared/schemas/mission-control/deployment.js';
import { engineService } from '@shared/services/platform-admin/index.js';
import { getDataSource } from '@shared/db/data-source.js';
import { Engine } from '@shared/db/entities/Engine.js';
import { ENGINE_VIEW_ROLES, ENGINE_MANAGE_ROLES } from '@shared/constants/roles.js';

async function getActiveEngineIdOrNull(): Promise<string | null> {
  const dataSource = await getDataSource();
  const engineRepo = dataSource.getRepository(Engine);
  const engine = await engineRepo.findOneBy({ active: true });
  return engine ? String(engine.id) : null;
}

const r = Router();

// List deployments
r.get('/starbase-api/deployments', apiLimiter, requireAuth, validateQuery(DeploymentQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const engineId = await getActiveEngineIdOrNull();
  if (!engineId || !(await engineService.hasEngineAccess(userId, engineId, ENGINE_VIEW_ROLES))) {
    throw Errors.fileNotFound();
  }
  const data = await listDeployments(req.query);
  res.json(data);
}));

// Get deployment by ID
r.get('/starbase-api/deployments/:id', apiLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const engineId = await getActiveEngineIdOrNull();
  if (!engineId || !(await engineService.hasEngineAccess(userId, engineId, ENGINE_VIEW_ROLES))) {
    throw Errors.fileNotFound();
  }
  const data = await fetchDeploymentById(req.params.id);
  res.json(data);
}));

// Delete deployment
r.delete('/starbase-api/deployments/:id', apiLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const engineId = await getActiveEngineIdOrNull();
  if (!engineId || !(await engineService.hasEngineAccess(userId, engineId, ENGINE_MANAGE_ROLES))) {
    throw Errors.fileNotFound();
  }
  const cascade = req.query.cascade === 'true';
  await removeDeployment(req.params.id, cascade);
  res.status(204).end();
}));

// Get process definition diagram
r.get('/starbase-api/process-definitions/:id/diagram', apiLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const engineId = await getActiveEngineIdOrNull();
  if (!engineId || !(await engineService.hasEngineAccess(userId, engineId, ENGINE_VIEW_ROLES))) {
    throw Errors.fileNotFound();
  }
  const data = await fetchProcessDefinitionDiagram(req.params.id);
  res.json(data);
}));

// Create deployment (multipart/form-data)
// Note: This requires multer middleware for file uploads
// Implementation deferred until multer is configured
r.post('/starbase-api/deployments', apiLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ 
    message: 'Deployment creation requires multipart/form-data support and must go through the backend. Configure multer middleware to enable this endpoint.' 
  });
}));

export default r;
