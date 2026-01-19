import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireAdmin, optionalAuth } from '../../../src/shared/middleware/auth.js';
import * as jwt from '../../../src/shared/utils/jwt.js';
import { Request, Response, NextFunction } from 'express';

vi.mock('@shared/utils/jwt.js', () => ({
  verifyToken: vi.fn(),
}));

describe('auth middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {}, cookies: {} };
    res = {};
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('accepts valid bearer token', () => {
      req.headers = { authorization: 'Bearer valid-token' };
      (jwt.verifyToken as any).mockReturnValue({ userId: 'user-1', type: 'access', platformRole: 'user' });

      requireAuth(req as Request, res as Response, next);

      expect(req.user).toEqual({ userId: 'user-1', type: 'access', platformRole: 'user' });
      expect(next).toHaveBeenCalled();
    });

    it('accepts token from cookies', () => {
      req.cookies = { accessToken: 'cookie-token' };
      (jwt.verifyToken as any).mockReturnValue({ userId: 'user-1', type: 'access', platformRole: 'user' });

      requireAuth(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('throws on missing token', () => {
      expect(() => requireAuth(req as Request, res as Response, next)).toThrow('No token provided');
    });

    it('throws on invalid token type', () => {
      req.headers = { authorization: 'Bearer refresh-token' };
      (jwt.verifyToken as any).mockReturnValue({ userId: 'user-1', type: 'refresh' });

      expect(() => requireAuth(req as Request, res as Response, next)).toThrow('Invalid token type');
    });
  });

  describe('requireAdmin', () => {
    it('allows admin users', () => {
      req.user = { userId: 'admin-1', type: 'access', platformRole: 'admin' };

      requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('throws for non-admin users', () => {
      req.user = { userId: 'user-1', type: 'access', platformRole: 'user' };

      expect(() => requireAdmin(req as Request, res as Response, next)).toThrow('Admin access required');
    });

    it('throws when no user', () => {
      expect(() => requireAdmin(req as Request, res as Response, next)).toThrow('Authentication required');
    });
  });

  describe('optionalAuth', () => {
    it('adds user when token present', () => {
      req.headers = { authorization: 'Bearer valid-token' };
      (jwt.verifyToken as any).mockReturnValue({ userId: 'user-1', type: 'access', platformRole: 'user' });

      optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('continues without user when no token', () => {
      optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
