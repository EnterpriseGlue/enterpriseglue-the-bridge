import { describe, it, expect } from 'vitest';
import { useProcessesData } from '@src/features/mission-control/processes-overview/hooks/useProcessesData';

describe('useProcessesData', () => {
  it('exports a hook function', () => {
    expect(typeof useProcessesData).toBe('function');
  });
});
