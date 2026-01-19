import { describe, it, expect } from 'vitest';
import VerifyEmail from '@src/pages/VerifyEmail';

describe('VerifyEmail', () => {
  it('exports VerifyEmail page component', () => {
    expect(VerifyEmail).toBeDefined();
    expect(typeof VerifyEmail).toBe('function');
  });
});
