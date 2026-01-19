import { Router, Request, Response } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { validateBody, validateQuery } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js';
import {
  listDecisionDefinitions,
  fetchDecisionDefinition,
  fetchDecisionDefinitionXml,
  evaluateDecisionById,
  evaluateDecisionByKey,
} from './service.js';
import {
  DecisionDefinitionQueryParams,
  EvaluateDecisionRequest,
} from '@shared/schemas/mission-control/decision.js';

const r = Router();

r.use(requireAuth, requireActiveEngineReadOrWrite());

// List decision definitions
r.get('/mission-control-api/decision-definitions', validateQuery(DecisionDefinitionQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listDecisionDefinitions(req.query);
  res.json(data);
}));

// Get decision definition by ID
r.get('/mission-control-api/decision-definitions/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = await fetchDecisionDefinition(req.params.id);
  res.json(data);
}));

// Get decision definition XML
r.get('/mission-control-api/decision-definitions/:id/xml', asyncHandler(async (req: Request, res: Response) => {
  const data = await fetchDecisionDefinitionXml(req.params.id);
  res.json(data);
}));

// Evaluate decision
r.post('/mission-control-api/decision-definitions/:id/evaluate', validateBody(EvaluateDecisionRequest), asyncHandler(async (req: Request, res: Response) => {
  const data = await evaluateDecisionById(req.params.id, req.body);
  res.json(data);
}));

// Evaluate decision by key
r.post('/mission-control-api/decision-definitions/key/:key/evaluate', validateBody(EvaluateDecisionRequest), asyncHandler(async (req: Request, res: Response) => {
  const data = await evaluateDecisionByKey(req.params.key, req.body);
  res.json(data);
}));

export default r;
