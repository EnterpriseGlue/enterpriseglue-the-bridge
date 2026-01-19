import { describe, it, expect } from 'vitest';
import StarbaseHome from '@src/features/starbase/pages/StarbaseHome';

describe('StarbaseHome', () => {
  it('exports StarbaseHome page component', () => {
    expect(StarbaseHome).toBeDefined();
    expect(typeof StarbaseHome).toBe('function');
  });
});
