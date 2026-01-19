import { describe, it, expect } from 'vitest';
import { useDragToPan } from '@src/features/shared/components/viewer/useDragToPan';

describe('useDragToPan', () => {
  it('exports useDragToPan hook', () => {
    expect(useDragToPan).toBeDefined();
    expect(typeof useDragToPan).toBe('function');
  });
});
