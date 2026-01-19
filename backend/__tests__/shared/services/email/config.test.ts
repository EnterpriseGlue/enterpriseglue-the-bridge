import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getResendClient } from '../../../../src/shared/services/email/config.js';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@shared/config/index.js', () => ({
  config: {
    resendApiKey: null,
  },
}));

describe('email config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when RESEND_API_KEY not configured', () => {
    const client = getResendClient();
    expect(client).toBeNull();
  });
});
