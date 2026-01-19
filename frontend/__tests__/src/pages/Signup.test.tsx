import { describe, it, expect } from 'vitest';
import Signup from '@src/pages/Signup';

describe('Signup', () => {
  it('exports Signup page component', () => {
    expect(Signup).toBeDefined();
    expect(typeof Signup).toBe('function');
  });
});
