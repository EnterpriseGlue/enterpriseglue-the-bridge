import { Router, Request, Response } from 'express';
import { requireAuth } from '@enterpriseglue/shared/middleware/auth.js';
import { notificationsLimiter } from '@enterpriseglue/shared/middleware/rateLimiter.js';
import { NotificationSSEManager } from '@enterpriseglue/shared/services/notifications/index.js';

export function createNotificationStreamRouter(
  sseManager: NotificationSSEManager
) {
  const router = Router();
  
  // GET /api/notifications/stream
  // SSE endpoint for real-time notifications
  router.get('/stream', notificationsLimiter, requireAuth, (req: Request, res: Response) => {
    sseManager.handleConnection(req, res);
  });
  
  return router;
}
