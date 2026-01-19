import { describe, it, expect, vi } from 'vitest';

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

describe('GitLabClient', () => {
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
