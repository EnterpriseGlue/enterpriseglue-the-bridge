import { describe, it, expect, vi } from 'vitest';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/services/email/config.js', () => ({
  getResendClient: vi.fn(),
}));

describe('email auth service', () => {
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
