import { describe, it, expect } from 'vitest';
import DMNDrdMini from '@src/features/starbase/components/DMNDrdMini';

describe('DMNDrdMini', () => {
  it('exports DMNDrdMini component', () => {
    expect(DMNDrdMini).toBeDefined();
    expect(typeof DMNDrdMini).toBe('function');
  });
});
