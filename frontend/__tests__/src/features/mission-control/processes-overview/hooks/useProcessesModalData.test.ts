import { describe, it, expect } from 'vitest';
import { useProcessesModalData } from '@src/features/mission-control/processes-overview/hooks/useProcessesModalData';

describe('useProcessesModalData', () => {
  it('exports a hook function', () => {
    expect(typeof useProcessesModalData).toBe('function');
  });
});
