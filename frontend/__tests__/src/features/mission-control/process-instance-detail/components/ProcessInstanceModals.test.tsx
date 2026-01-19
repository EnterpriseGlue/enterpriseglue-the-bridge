import { describe, it, expect } from 'vitest';
import { ProcessInstanceModals } from '@src/features/mission-control/process-instance-detail/components/ProcessInstanceModals';

describe('ProcessInstanceModals', () => {
  it('exports ProcessInstanceModals component', () => {
    expect(ProcessInstanceModals).toBeDefined();
    expect(typeof ProcessInstanceModals).toBe('function');
  });
});
