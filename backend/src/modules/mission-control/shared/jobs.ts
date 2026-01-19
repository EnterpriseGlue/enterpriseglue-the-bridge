import { Router, Request, Response } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { validateBody, validateQuery } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js';
import {
  listJobs,
  getJobById,
  executeJobById,
  setJobRetriesById,
  setJobSuspensionStateById,
  listJobDefinitions,
  setJobDefinitionRetriesById,
  setJobDefinitionSuspensionStateById,
} from './jobs-service.js';
import {
  JobQueryParams,
  JobDefinitionQueryParams,
  SetJobRetriesRequest,
  SetJobSuspensionStateRequest,
  SetJobDefinitionRetriesRequest,
  SetJobDefinitionSuspensionStateRequest,
} from '@shared/schemas/mission-control/job.js';

const r = Router();

r.use(requireAuth, requireActiveEngineReadOrWrite());

// Query jobs
r.get('/mission-control-api/jobs', validateQuery(JobQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listJobs(req.query);
  res.json(data);
}));

// Get job by ID
r.get('/mission-control-api/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = await getJobById(req.params.id);
  res.json(data);
}));

// Execute job
r.post('/mission-control-api/jobs/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  await executeJobById(req.params.id);
  res.status(204).end();
}));

// Set job retries
r.put('/mission-control-api/jobs/:id/retries', validateBody(SetJobRetriesRequest), asyncHandler(async (req: Request, res: Response) => {
  await setJobRetriesById(req.params.id, req.body);
  res.status(204).end();
}));

// Set job suspension state
r.put('/mission-control-api/jobs/:id/suspended', validateBody(SetJobSuspensionStateRequest), asyncHandler(async (req: Request, res: Response) => {
  await setJobSuspensionStateById(req.params.id, req.body);
  res.status(204).end();
}));

// Query job definitions
r.get('/mission-control-api/job-definitions', validateQuery(JobDefinitionQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listJobDefinitions(req.query);
  res.json(data);
}));

// Set job definition retries
r.put('/mission-control-api/job-definitions/:id/retries', validateBody(SetJobDefinitionRetriesRequest), asyncHandler(async (req: Request, res: Response) => {
  await setJobDefinitionRetriesById(req.params.id, req.body);
  res.status(204).end();
}));

// Set job definition suspension state
r.put('/mission-control-api/job-definitions/:id/suspended', validateBody(SetJobDefinitionSuspensionStateRequest), asyncHandler(async (req: Request, res: Response) => {
  await setJobDefinitionSuspensionStateById(req.params.id, req.body);
  res.status(204).end();
}));

export default r;
