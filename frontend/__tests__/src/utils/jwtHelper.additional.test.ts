import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { decodeJWT, isTokenExpired, shouldRefreshToken, getTimeUntilExpiry } from '@src/utils/jwtHelper';

describe('jwtHelper utils additional', () => {
  const createToken = (exp: number) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'user-1', email: 'test@example.com', role: 'user', exp, iat: Math.floor(Date.now() / 1000) }));
    const signature = 'fake-signature';
    return `${header}.${payload}.${signature}`;
  };

  describe('decodeJWT', () => {
    it('decodes valid JWT token', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = createToken(exp);
      const payload = decodeJWT(token);

      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe('user-1');
      expect(payload?.email).toBe('test@example.com');
    });

    it('returns null for invalid token', () => {
      expect(decodeJWT('invalid')).toBeNull();
      expect(decodeJWT('not.a.token')).toBeNull();
    });

    it('returns null for malformed token', () => {
      expect(decodeJWT('header.payload')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('detects expired token', () => {
      const exp = Math.floor(Date.now() / 1000) - 3600;
      const token = createToken(exp);
      expect(isTokenExpired(token)).toBe(true);
    });

    it('detects valid token', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = createToken(exp);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('returns true for invalid token', () => {
      expect(isTokenExpired('invalid')).toBe(true);
    });
  });

  describe('shouldRefreshToken', () => {
    it('returns true when token expires soon', () => {
      const exp = Math.floor(Date.now() / 1000) + 60;
      const token = createToken(exp);
      expect(shouldRefreshToken(token)).toBe(true);
    });

    it('returns false when token has plenty of time', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = createToken(exp);
      expect(shouldRefreshToken(token)).toBe(false);
    });

    it('returns true for invalid token', () => {
      expect(shouldRefreshToken('invalid')).toBe(true);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('calculates time until expiry', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = createToken(exp);
      const remaining = getTimeUntilExpiry(token);

      expect(remaining).toBeGreaterThan(3599000);
      expect(remaining).toBeLessThanOrEqual(3600000);
    });

    it('returns 0 for expired token', () => {
      const exp = Math.floor(Date.now() / 1000) - 3600;
      const token = createToken(exp);
      expect(getTimeUntilExpiry(token)).toBe(0);
    });

    it('returns 0 for invalid token', () => {
      expect(getTimeUntilExpiry('invalid')).toBe(0);
    });
  });
});
