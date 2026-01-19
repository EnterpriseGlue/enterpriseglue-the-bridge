import { describe, it, expect } from 'vitest';
import { useVariableEditor } from '@src/features/mission-control/process-instance-detail/components/hooks/useVariableEditor';

describe('useVariableEditor', () => {
  it('exports useVariableEditor hook', () => {
    expect(useVariableEditor).toBeDefined();
    expect(typeof useVariableEditor).toBe('function');
  });
});
