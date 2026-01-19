import { describe, it, expect } from 'vitest';
import * as instanceModule from '@src/features/mission-control/process-instance-detail/components';

describe('process-instance-detail components index', () => {
  it('exports instance detail components and utilities', () => {
    expect(instanceModule.InstanceHeader).toBeDefined();
    expect(instanceModule.ActivityDetailPanel).toBeDefined();
    expect(instanceModule.ActivityHistoryPanel).toBeDefined();
    expect(instanceModule.ActivityDetailsPanel).toBeDefined();
    expect(instanceModule.SPLIT_PANE_STORAGE_KEY).toBeDefined();
    expect(instanceModule.DEFAULT_SPLIT_SIZE).toBeDefined();
    expect(instanceModule.calculateInstanceStatus).toBeDefined();
    expect(instanceModule.buildActivityGroups).toBeDefined();
  });
});
