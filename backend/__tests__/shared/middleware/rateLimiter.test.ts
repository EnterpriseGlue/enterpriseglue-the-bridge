import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRateLimit = vi.fn((options) => options);

vi.mock('express-rate-limit', () => ({
  default: (options: any) => mockRateLimit(options),
}));

describe('rateLimiter middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    mockRateLimit.mockClear();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('uses development limits by default', async () => {
    process.env.NODE_ENV = 'development';
    const module = await import('../../../src/shared/middleware/rateLimiter.js');

    expect((module.apiLimiter as any).max).toBe(1000);
    expect((module.authLimiter as any).max).toBe(50);
    expect((module.createUserLimiter as any).max).toBe(20);
    expect((module.passwordResetLimiter as any).max).toBe(3);
  });

  it('uses production limits when NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    const module = await import('../../../src/shared/middleware/rateLimiter.js');

    expect((module.apiLimiter as any).max).toBe(100);
    expect((module.authLimiter as any).max).toBe(5);
  });

  it('generates user-based keys for project limiter', async () => {
    process.env.NODE_ENV = 'development';
    const module = await import('../../../src/shared/middleware/rateLimiter.js');

    const key = (module.projectCreateLimiter as any).keyGenerator({
      user: { userId: 'user-1' },
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    });

    expect(key).toBe('user:user-1');
  });

  it('falls back to ip when no user for file limiter', async () => {
    process.env.NODE_ENV = 'development';
    const module = await import('../../../src/shared/middleware/rateLimiter.js');

    const key = (module.fileOperationsLimiter as any).keyGenerator({
      headers: { 'x-forwarded-for': '10.0.0.1' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    });

    expect(key).toBe('ip:10.0.0.1');
  });
});
