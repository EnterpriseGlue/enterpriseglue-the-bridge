import { describe, it, expect } from 'vitest';
import SsoMappings from '@src/features/platform-admin/pages/SsoMappings';

describe('SsoMappings', () => {
  it('exports SsoMappings page component', () => {
    expect(SsoMappings).toBeDefined();
    expect(typeof SsoMappings).toBe('function');
  });
});
