import { describe, it, expect } from 'vitest';
import TenantSettings from '@src/pages/admin/TenantSettings';

describe('TenantSettings', () => {
  it('exports TenantSettings admin page component', () => {
    expect(TenantSettings).toBeDefined();
    expect(typeof TenantSettings).toBe('function');
  });
});
