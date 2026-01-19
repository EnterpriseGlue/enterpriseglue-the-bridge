import { describe, it, expect, vi } from 'vitest';
import { decodeJWT, isTokenExpired, shouldRefreshToken, getTimeUntilExpiry } from '@src/utils/jwtHelper';

function createToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

function createBase64UrlToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.sig`;
}

describe('jwtHelper', () => {
  it('decodes jwt payloads', () => {
    const token = createToken({ sub: 'user', exp: 9999999999 });
    expect(decodeJWT(token)?.sub).toBe('user');
  });

  it('handles invalid tokens', () => {
    expect(decodeJWT('bad.token')).toBeNull();
    expect(decodeJWT('one.two')).toBeNull();
    expect(decodeJWT('')).toBeNull();
  });

  it('handles base64url encoding', () => {
    const token = createBase64UrlToken({ sub: 'user-2', exp: 9999999999 });
    expect(decodeJWT(token)?.sub).toBe('user-2');
  });

  it('detects expiry and refresh window', () => {
    const base = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(base);
    const exp = Math.floor((base + 60_000) / 1000);
    const token = createToken({ exp });
    expect(isTokenExpired(token)).toBe(false);
    expect(shouldRefreshToken(token)).toBe(true);
    vi.restoreAllMocks();
  });

  it('marks tokens without exp as expired and refreshable', () => {
    const token = createToken({ sub: 'user' });
    expect(isTokenExpired(token)).toBe(true);
    expect(shouldRefreshToken(token)).toBe(true);
  });

  it('does not refresh when expiry is far in the future', () => {
    const base = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(base);
    const exp = Math.floor((base + 10 * 60 * 1000) / 1000);
    const token = createToken({ exp });
    expect(shouldRefreshToken(token)).toBe(false);
    vi.restoreAllMocks();
  });

  it('returns time until expiry', () => {
    const base = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(base);
    const exp = Math.floor((base + 120_000) / 1000);
    const token = createToken({ exp });
    expect(getTimeUntilExpiry(token)).toBe(120_000);
    vi.restoreAllMocks();
  });

  it('returns 0 for invalid tokens', () => {
    expect(getTimeUntilExpiry('bad.token')).toBe(0);
  });
});
