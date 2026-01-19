import { describe, it, expect } from 'vitest';
import Inspectors from '@src/features/starbase/components/Inspectors';

describe('Inspectors', () => {
  it('exports Inspectors component', () => {
    expect(Inspectors).toBeDefined();
    expect(typeof Inspectors).toBe('function');
  });
});
