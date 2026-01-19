import { describe, it, expect } from 'vitest';
import { TerminateConfirmModal } from '@src/features/mission-control/process-instance-detail/components/modals/TerminateConfirmModal';

describe('TerminateConfirmModal', () => {
  it('exports TerminateConfirmModal component', () => {
    expect(TerminateConfirmModal).toBeDefined();
    expect(typeof TerminateConfirmModal).toBe('function');
  });
});
