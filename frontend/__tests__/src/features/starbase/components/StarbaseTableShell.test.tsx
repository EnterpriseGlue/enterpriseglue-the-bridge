import { describe, it, expect } from 'vitest';
import { StarbaseTableShell } from '@src/features/starbase/components/StarbaseTableShell';

describe('StarbaseTableShell', () => {
  it('exports StarbaseTableShell component', () => {
    expect(StarbaseTableShell).toBeDefined();
    expect(typeof StarbaseTableShell).toBe('function');
  });
});
