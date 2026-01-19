import { Router, Request, Response } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { validateQuery } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js';
import {
  listHistoricTasks,
  listHistoricVariables,
  listHistoricDecisions,
  listHistoricDecisionInputs,
  listHistoricDecisionOutputs,
  listUserOperations,
} from './history-extended-service.js';
import {
  HistoricTaskQueryParams,
  HistoricVariableQueryParams,
  HistoricDecisionQueryParams,
  UserOperationLogQueryParams,
} from '@shared/schemas/mission-control/history.js';

const r = Router();

r.use(requireAuth, requireActiveEngineReadOrWrite());

// Get historic task instances
r.get('/mission-control-api/history/tasks', validateQuery(HistoricTaskQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listHistoricTasks(req.query);
  res.json(data);
}));

// Get historic variable instances
r.get('/mission-control-api/history/variables', validateQuery(HistoricVariableQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listHistoricVariables(req.query);
  res.json(data);
}));

// Get historic decision instances
r.get('/mission-control-api/history/decisions', validateQuery(HistoricDecisionQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listHistoricDecisions(req.query);
  res.json(data);
}));

// Get historic decision instance inputs
r.get('/mission-control-api/history/decisions/:id/inputs', asyncHandler(async (req: Request, res: Response) => {
  const data = await listHistoricDecisionInputs(req.params.id);
  res.json(data);
}));

// Get historic decision instance outputs
r.get('/mission-control-api/history/decisions/:id/outputs', asyncHandler(async (req: Request, res: Response) => {
  const data = await listHistoricDecisionOutputs(req.params.id);
  res.json(data);
}));

// Get user operation log
r.get('/mission-control-api/history/user-operations', validateQuery(UserOperationLogQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listUserOperations(req.query);
  res.json(data);
}));

export default r;
