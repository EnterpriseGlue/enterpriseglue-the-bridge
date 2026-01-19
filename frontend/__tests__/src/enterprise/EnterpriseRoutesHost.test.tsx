import { describe, it, expect } from 'vitest';
import { EnterpriseRoutesHost } from '@src/enterprise/EnterpriseRoutesHost';

describe('EnterpriseRoutesHost', () => {
  it('exports EnterpriseRoutesHost component', () => {
    expect(EnterpriseRoutesHost).toBeDefined();
    expect(typeof EnterpriseRoutesHost).toBe('function');
  });
});
