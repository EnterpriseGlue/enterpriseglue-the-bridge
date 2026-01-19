import { describe, it, expect } from 'vitest';
import {
  SPLIT_PANE_STORAGE_KEY,
  SPLIT_PANE_VERTICAL_STORAGE_KEY,
  DEFAULT_SPLIT_SIZE,
  DEFAULT_VERTICAL_SPLIT_SIZE,
  calculateInstanceStatus,
} from '@src/features/mission-control/process-instance-detail/components/utils';

describe('process instance detail utils', () => {
  it('exposes split pane defaults', () => {
    expect(SPLIT_PANE_STORAGE_KEY).toContain('split-pane');
    expect(SPLIT_PANE_VERTICAL_STORAGE_KEY).toContain('vertical');
    expect(DEFAULT_SPLIT_SIZE).toBe('60%');
    expect(DEFAULT_VERTICAL_SPLIT_SIZE).toBe('30%');
  });

  it('calculates completed and canceled statuses', () => {
    expect(calculateInstanceStatus({ endTime: 1 }, {})).toBe('COMPLETED');
    expect(calculateInstanceStatus({ endTime: 1, deleteReason: 'manual' }, {})).toBe('CANCELED');
  });

  it('calculates suspended and active statuses', () => {
    expect(calculateInstanceStatus(null, { suspended: true })).toBe('SUSPENDED');
    expect(calculateInstanceStatus(null, {})).toBe('ACTIVE');
  });
});
