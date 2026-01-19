import { describe, it, expect, vi } from 'vitest';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/services/platform-admin/ProjectMemberService.js', () => ({
  projectMemberService: {
    hasProjectAccess: vi.fn(),
  },
}));

describe('projectAuth middleware', () => {
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
