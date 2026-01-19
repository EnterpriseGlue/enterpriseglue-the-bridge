import { describe, it, expect } from 'vitest';
import { ActivityDetailPanel } from '@src/features/mission-control/process-instance-detail/components/ActivityDetailPanel';

describe('ActivityDetailPanel', () => {
  it('exports ActivityDetailPanel component', () => {
    expect(ActivityDetailPanel).toBeDefined();
    expect(typeof ActivityDetailPanel).toBe('function');
  });
});
