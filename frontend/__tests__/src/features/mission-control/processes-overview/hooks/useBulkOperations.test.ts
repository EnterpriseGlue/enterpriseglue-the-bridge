import { describe, it, expect } from 'vitest';
import { useBulkOperations } from '@src/features/mission-control/processes-overview/hooks/useBulkOperations';

describe('useBulkOperations', () => {
  it('exports a hook function', () => {
    expect(typeof useBulkOperations).toBe('function');
  });
});
