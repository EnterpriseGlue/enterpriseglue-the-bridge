import { Router, Request, Response } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { validateBody, validateQuery } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js';
import {
  fetchAndLockTasks,
  listExternalTasks,
  completeTask,
  failTask,
  bpmnErrorTask,
  extendTaskLock,
  unlockTask,
} from './external-tasks-service.js';
import {
  FetchAndLockRequest,
  CompleteExternalTaskRequest,
  ExternalTaskFailureRequest,
  ExternalTaskBpmnErrorRequest,
  ExtendLockRequest,
  ExternalTaskQueryParams,
} from '@shared/schemas/mission-control/external-task.js';

const r = Router();

r.use(requireAuth, requireActiveEngineReadOrWrite());

// Fetch and lock external tasks
r.post('/mission-control-api/external-tasks/fetchAndLock', validateBody(FetchAndLockRequest), asyncHandler(async (req: Request, res: Response) => {
  const data = await fetchAndLockTasks(req.body);
  res.json(data);
}));

// Query external tasks
r.get('/mission-control-api/external-tasks', validateQuery(ExternalTaskQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listExternalTasks(req.query);
  res.json(data);
}));

// Complete external task
r.post('/mission-control-api/external-tasks/:id/complete', validateBody(CompleteExternalTaskRequest), asyncHandler(async (req: Request, res: Response) => {
  await completeTask(req.params.id, req.body);
  res.status(204).end();
}));

// Handle external task failure
r.post('/mission-control-api/external-tasks/:id/failure', validateBody(ExternalTaskFailureRequest), asyncHandler(async (req: Request, res: Response) => {
  await failTask(req.params.id, req.body);
  res.status(204).end();
}));

// Handle external task BPMN error
r.post('/mission-control-api/external-tasks/:id/bpmnError', validateBody(ExternalTaskBpmnErrorRequest), asyncHandler(async (req: Request, res: Response) => {
  await bpmnErrorTask(req.params.id, req.body);
  res.status(204).end();
}));

// Extend external task lock
r.post('/mission-control-api/external-tasks/:id/extendLock', validateBody(ExtendLockRequest), asyncHandler(async (req: Request, res: Response) => {
  await extendTaskLock(req.params.id, req.body);
  res.status(204).end();
}));

// Unlock external task
r.post('/mission-control-api/external-tasks/:id/unlock', asyncHandler(async (req: Request, res: Response) => {
  await unlockTask(req.params.id);
  res.status(204).end();
}));

export default r;
