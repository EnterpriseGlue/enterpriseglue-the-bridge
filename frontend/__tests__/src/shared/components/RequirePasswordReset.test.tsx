import { describe, it, expect } from 'vitest';
import { RequirePasswordReset } from '@src/shared/components/RequirePasswordReset';

describe('RequirePasswordReset', () => {
  it('exports RequirePasswordReset component', () => {
    expect(RequirePasswordReset).toBeDefined();
    expect(typeof RequirePasswordReset).toBe('function');
  });
});
