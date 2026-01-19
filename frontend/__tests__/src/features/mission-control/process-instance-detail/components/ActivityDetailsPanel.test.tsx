import { describe, it, expect } from 'vitest';
import { ActivityDetailsPanel } from '@src/features/mission-control/process-instance-detail/components/ActivityDetailsPanel';

describe('ActivityDetailsPanel', () => {
  it('exports ActivityDetailsPanel component', () => {
    expect(ActivityDetailsPanel).toBeDefined();
    expect(typeof ActivityDetailsPanel).toBe('function');
  });
});
