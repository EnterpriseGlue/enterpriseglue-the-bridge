import { Router, Request, Response } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { validateBody, validateQuery } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js';
import {
  listTasks,
  getTaskById,
  getTaskCountByQuery,
  claimTaskById,
  unclaimTaskById,
  setTaskAssigneeById,
  completeTaskById,
  getTaskVariablesById,
  updateTaskVariablesById,
  getTaskFormById,
} from './tasks-service.js';
import {
  TaskQueryParams,
  ClaimTaskRequest,
  SetAssigneeRequest,
  CompleteTaskRequest,
  TaskVariablesRequest,
} from '@shared/schemas/mission-control/task.js';

const r = Router();

r.use(requireAuth, requireActiveEngineReadOrWrite());

// Query tasks
r.get('/mission-control-api/tasks', validateQuery(TaskQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listTasks(req.query);
  res.json(data);
}));

// Get task count
r.get('/mission-control-api/tasks/count', validateQuery(TaskQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await getTaskCountByQuery(req.query);
  res.json(data);
}));

// Get task by ID
r.get('/mission-control-api/tasks/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = await getTaskById(req.params.id);
  res.json(data);
}));

// Get task variables
r.get('/mission-control-api/tasks/:id/variables', asyncHandler(async (req: Request, res: Response) => {
  const data = await getTaskVariablesById(req.params.id);
  res.json(data);
}));

// Update task variables
r.put('/mission-control-api/tasks/:id/variables', validateBody(TaskVariablesRequest), asyncHandler(async (req: Request, res: Response) => {
  const data = await updateTaskVariablesById(req.params.id, req.body);
  res.json(data);
}));

// Get task form
r.get('/mission-control-api/tasks/:id/form', asyncHandler(async (req: Request, res: Response) => {
  const data = await getTaskFormById(req.params.id);
  res.json(data);
}));

// Claim task
r.post('/mission-control-api/tasks/:id/claim', validateBody(ClaimTaskRequest), asyncHandler(async (req: Request, res: Response) => {
  await claimTaskById(req.params.id, req.body);
  res.status(204).end();
}));

// Unclaim task
r.post('/mission-control-api/tasks/:id/unclaim', asyncHandler(async (req: Request, res: Response) => {
  await unclaimTaskById(req.params.id);
  res.status(204).end();
}));

// Set task assignee
r.post('/mission-control-api/tasks/:id/assignee', validateBody(SetAssigneeRequest), asyncHandler(async (req: Request, res: Response) => {
  await setTaskAssigneeById(req.params.id, req.body);
  res.status(204).end();
}));

// Complete task
r.post('/mission-control-api/tasks/:id/complete', validateBody(CompleteTaskRequest.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await completeTaskById(req.params.id, req.body);
  res.json(data || {});
}));

export default r;
