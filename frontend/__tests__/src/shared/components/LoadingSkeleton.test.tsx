import { describe, it, expect } from 'vitest';
import { LoadingSkeleton } from '@src/shared/components/LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('exports LoadingSkeleton component', () => {
    expect(LoadingSkeleton).toBeDefined();
    expect(typeof LoadingSkeleton).toBe('function');
  });
});
