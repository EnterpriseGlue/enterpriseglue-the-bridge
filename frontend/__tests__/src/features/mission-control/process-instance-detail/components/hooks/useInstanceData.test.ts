import { describe, it, expect } from 'vitest';
import { useInstanceData } from '@src/features/mission-control/process-instance-detail/components/hooks/useInstanceData';

describe('useInstanceData', () => {
  it('exports useInstanceData hook', () => {
    expect(useInstanceData).toBeDefined();
    expect(typeof useInstanceData).toBe('function');
  });
});
