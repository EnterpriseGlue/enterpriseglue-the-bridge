import { describe, it, expect } from 'vitest';
import { ProcessInstanceBottomPane } from '@src/features/mission-control/process-instance-detail/components/ProcessInstanceBottomPane';

describe('ProcessInstanceBottomPane', () => {
  it('exports ProcessInstanceBottomPane component', () => {
    expect(ProcessInstanceBottomPane).toBeDefined();
    expect(typeof ProcessInstanceBottomPane).toBe('function');
  });
});
