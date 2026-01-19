import { describe, it, expect, vi } from 'vitest';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'msg-1' }),
    },
  })),
}));

vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
  }),
}));

describe('email-providers', () => {
  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
