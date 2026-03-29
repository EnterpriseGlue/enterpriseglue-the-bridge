/**
 * Interfaces Layer - HTTP Controllers
 * 
 * Controller interfaces define the contract for HTTP request handling.
 * Backend-host implements these controllers using Express.
 * 
 * Phase 4: Interfaces layer provides controller contracts and schemas.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Base controller interface
 * All controllers must implement this contract
 */
export interface Controller {
  handle(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

/**
 * Async controller type helper
 */
export type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Route definition for declarative routing
 */
export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  handler: Controller | AsyncController;
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * Controller registry for module routes
 */
export interface ControllerModule {
  basePath: string;
  routes: RouteDefinition[];
}

// Export controller interfaces
export type { AuthController } from './auth/AuthController.js';
export type { NotificationController } from './notifications/NotificationController.js';
