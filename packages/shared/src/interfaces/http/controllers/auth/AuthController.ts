/**
 * Auth Controller Interface
 * 
 * Defines the contract for authentication HTTP endpoints.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Base controller interface
 */
interface Controller {
  handle(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

/**
 * Authentication controller contract
 * Backend-host implements this with Express routes
 */
export interface AuthController extends Controller {
  /**
   * Handle user login
   * POST /auth/login
   */
  login(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Handle user logout
   * POST /auth/logout
   */
  logout(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refresh(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Get current user
   * GET /auth/me
   */
  me(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Request password reset
   * POST /auth/forgot-password
   */
  forgotPassword(req: unknown, res: unknown, next: unknown): Promise<void>;

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  resetPassword(req: unknown, res: unknown, next: unknown): Promise<void>;
}

/**
 * Auth controller implementation placeholder
 * This is implemented in backend-host with Express
 */
export const AuthControllerSymbol = Symbol('AuthController');
