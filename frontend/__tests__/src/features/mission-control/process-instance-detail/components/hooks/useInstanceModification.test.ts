import { describe, it, expect } from 'vitest';
import { useInstanceModification } from '@src/features/mission-control/process-instance-detail/components/hooks/useInstanceModification';

describe('useInstanceModification', () => {
  it('exports useInstanceModification hook', () => {
    expect(useInstanceModification).toBeDefined();
    expect(typeof useInstanceModification).toBe('function');
  });
});
