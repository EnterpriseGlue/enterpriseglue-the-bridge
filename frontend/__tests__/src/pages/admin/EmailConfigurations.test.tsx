import { describe, it, expect } from 'vitest';
import EmailConfigurations from '@src/pages/admin/EmailConfigurations';

describe('EmailConfigurations', () => {
  it('exports EmailConfigurations admin page component', () => {
    expect(EmailConfigurations).toBeDefined();
    expect(typeof EmailConfigurations).toBe('function');
  });
});
