import { Router, Request, Response } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { validateBody } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireActiveEngineReadOrWrite } from '@shared/middleware/activeEngineAuth.js';
import { sendMessage, sendSignal } from './messages-service.js';
import { CorrelateMessageRequest, SignalEventSchema } from '@shared/schemas/mission-control/message.js';

const r = Router();

r.use(requireAuth, requireActiveEngineReadOrWrite());

// Correlate message
r.post('/mission-control-api/messages', validateBody(CorrelateMessageRequest), asyncHandler(async (req: Request, res: Response) => {
  const data = await sendMessage(req.body);
  res.json(data);
}));

// Deliver signal
r.post('/mission-control-api/signals', validateBody(SignalEventSchema), asyncHandler(async (req: Request, res: Response) => {
  await sendSignal(req.body);
  res.status(204).end();
}));

export default r;
