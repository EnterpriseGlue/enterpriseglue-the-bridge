import { describe, it, expect } from 'vitest';
import Properties from '@src/features/starbase/components/Properties';

describe('Properties', () => {
  it('exports Properties component', () => {
    expect(Properties).toBeDefined();
    expect(typeof Properties).toBe('function');
  });
});
