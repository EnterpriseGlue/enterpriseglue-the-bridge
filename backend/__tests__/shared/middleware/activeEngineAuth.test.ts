import { describe, it, expect, vi } from 'vitest';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/services/platform-admin/index.js', () => ({
  engineService: {
    hasEngineAccess: vi.fn(),
  },
}));

describe('activeEngineAuth middleware', () => {
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
