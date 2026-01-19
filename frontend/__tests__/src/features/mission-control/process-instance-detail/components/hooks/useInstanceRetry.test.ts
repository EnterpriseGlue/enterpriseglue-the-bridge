import { describe, it, expect } from 'vitest';
import { useInstanceRetry } from '@src/features/mission-control/process-instance-detail/components/hooks/useInstanceRetry';

describe('useInstanceRetry', () => {
  it('exports useInstanceRetry hook', () => {
    expect(useInstanceRetry).toBeDefined();
    expect(typeof useInstanceRetry).toBe('function');
  });
});
