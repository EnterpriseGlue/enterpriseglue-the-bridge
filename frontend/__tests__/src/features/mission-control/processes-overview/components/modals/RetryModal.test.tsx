import { describe, it, expect } from 'vitest';
import { RetryModal } from '@src/features/mission-control/processes-overview/components/modals/RetryModal';

describe('ProcessesOverview RetryModal', () => {
  it('exports RetryModal', () => {
    expect(RetryModal).toBeDefined();
    expect(typeof RetryModal).toBe('function');
  });
});
