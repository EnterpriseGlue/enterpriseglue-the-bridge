import { Router, Request, Response } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { validateQuery } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js';
import { listMetrics, getMetric } from './metrics-service.js';
import { MetricsQueryParams } from '@shared/schemas/mission-control/metrics.js';

const r = Router();

r.use(requireAuth, requireActiveEngineReadOrWrite());

// Query metrics
r.get('/mission-control-api/metrics', validateQuery(MetricsQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await listMetrics(req.query);
  res.json(data);
}));

// Get specific metric by name
r.get('/mission-control-api/metrics/:name', validateQuery(MetricsQueryParams.partial()), asyncHandler(async (req: Request, res: Response) => {
  const data = await getMetric(req.params.name, req.query);
  res.json(data);
}));

export default r;
