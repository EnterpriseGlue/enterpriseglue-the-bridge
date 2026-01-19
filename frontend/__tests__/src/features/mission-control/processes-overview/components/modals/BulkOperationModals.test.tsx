import { describe, it, expect } from 'vitest';
import { BulkOperationModals } from '@src/features/mission-control/processes-overview/components/modals/BulkOperationModals';

describe('BulkOperationModals', () => {
  it('exports BulkOperationModals component', () => {
    expect(BulkOperationModals).toBeDefined();
    expect(typeof BulkOperationModals).toBe('function');
  });
});
