import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmailConfigForTenant } from '../../../../src/shared/services/email/config.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn().mockResolvedValue({
    getRepository: () => ({
      findOneBy: vi.fn().mockResolvedValue(null),
    }),
  }),
}));

vi.mock('@shared/utils/crypto.js', () => ({
  decrypt: vi.fn((v: string) => v),
}));

describe('email config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no email config exists in database', async () => {
    const config = await getEmailConfigForTenant();
    expect(config).toBeNull();
  });
});
