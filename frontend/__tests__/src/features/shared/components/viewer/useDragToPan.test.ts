import { describe, it, expect } from 'vitest';
import { useDragToPan } from '@src/features/shared/components/viewer/useDragToPan';

describe('useDragToPan', () => {
  it('exports a hook function', () => {
    expect(typeof useDragToPan).toBe('function');
  });
});
