import { describe, it, expect, vi } from 'vitest';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/middleware/auth.js', () => ({
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@shared/middleware/projectAuth.js', () => ({
  requireProjectAccess: () => (_req: any, _res: any, next: any) => next(),
  requireFileAccess: () => (_req: any, _res: any, next: any) => next(),
}));

describe('starbase files', () => {
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
