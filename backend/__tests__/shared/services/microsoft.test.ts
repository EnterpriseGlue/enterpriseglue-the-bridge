import { describe, it, expect, vi } from 'vitest';
import { isMicrosoftAuthEnabled } from '../../../src/shared/services/microsoft.js';

vi.mock('@shared/config/index.js', () => ({
  config: {
    microsoftClientId: null,
    microsoftClientSecret: null,
    microsoftTenantId: null,
    microsoftRedirectUri: null,
  },
}));

describe('microsoft service', () => {
  it('returns false when Microsoft auth not configured', () => {
    const result = isMicrosoftAuthEnabled();
    expect(result).toBe(false);
  });
});
