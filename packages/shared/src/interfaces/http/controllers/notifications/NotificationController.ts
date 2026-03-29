/**
 * Notification Controller Interface
 * 
 * Defines the contract for notification HTTP endpoints.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Base controller interface
 */
interface Controller {
  handle(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

/**
 * Notification controller contract
 */
export interface NotificationController extends Controller {
  /**
   * List notifications for current user
   * GET /notifications
   */
  list(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  markAsRead(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Mark all notifications as read
   * POST /notifications/read-all
   */
  markAllAsRead(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Delete notification
   * DELETE /notifications/:id
   */
  delete(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * SSE stream for real-time notifications
   * GET /notifications/stream
   */
  stream(req: unknown, res: unknown, next: unknown): Promise<void>;
}

export const NotificationControllerSymbol = Symbol('NotificationController');
