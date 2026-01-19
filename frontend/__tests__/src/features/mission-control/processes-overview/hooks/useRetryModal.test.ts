import { describe, it, expect } from 'vitest';
import { useRetryModal } from '@src/features/mission-control/processes-overview/hooks/useRetryModal';

describe('useRetryModal', () => {
  it('exports a hook function', () => {
    expect(typeof useRetryModal).toBe('function');
  });
});
