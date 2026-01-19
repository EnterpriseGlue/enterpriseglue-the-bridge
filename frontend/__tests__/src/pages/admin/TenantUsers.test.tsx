import { describe, it, expect } from 'vitest';
import TenantUsers from '@src/pages/admin/TenantUsers';

describe('TenantUsers', () => {
  it('exports TenantUsers admin page component', () => {
    expect(TenantUsers).toBeDefined();
    expect(typeof TenantUsers).toBe('function');
  });
});
