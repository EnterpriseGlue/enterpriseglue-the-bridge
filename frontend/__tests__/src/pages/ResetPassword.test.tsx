import { describe, it, expect } from 'vitest';
import ResetPassword from '@src/pages/ResetPassword';

describe('ResetPassword', () => {
  it('exports ResetPassword page component', () => {
    expect(ResetPassword).toBeDefined();
    expect(typeof ResetPassword).toBe('function');
  });
});
