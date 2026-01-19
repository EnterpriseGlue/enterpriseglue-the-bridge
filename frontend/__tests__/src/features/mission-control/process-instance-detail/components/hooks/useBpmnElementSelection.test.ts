import { describe, it, expect } from 'vitest';
import { useBpmnElementSelection } from '@src/features/mission-control/process-instance-detail/components/hooks/useBpmnElementSelection';

describe('useBpmnElementSelection', () => {
  it('exports useBpmnElementSelection hook', () => {
    expect(useBpmnElementSelection).toBeDefined();
    expect(typeof useBpmnElementSelection).toBe('function');
  });
});
