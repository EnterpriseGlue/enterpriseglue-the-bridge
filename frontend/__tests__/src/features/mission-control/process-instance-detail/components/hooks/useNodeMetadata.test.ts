import { describe, it, expect } from 'vitest';
import { useNodeMetadata } from '@src/features/mission-control/process-instance-detail/components/hooks/useNodeMetadata';

describe('useNodeMetadata', () => {
  it('exports useNodeMetadata hook', () => {
    expect(useNodeMetadata).toBeDefined();
    expect(typeof useNodeMetadata).toBe('function');
  });
});
