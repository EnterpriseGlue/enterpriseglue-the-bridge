import { describe, it, expect } from 'vitest';
import { DiscardConfirmModal } from '@src/features/mission-control/process-instance-detail/components/modals/DiscardConfirmModal';

describe('DiscardConfirmModal', () => {
  it('exports DiscardConfirmModal component', () => {
    expect(DiscardConfirmModal).toBeDefined();
    expect(typeof DiscardConfirmModal).toBe('function');
  });
});
