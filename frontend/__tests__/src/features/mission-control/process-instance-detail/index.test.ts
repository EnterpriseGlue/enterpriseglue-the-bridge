import { describe, it, expect } from 'vitest';
import * as processInstanceDetail from '../../../../src/features/mission-control/process-instance-detail';

describe('process-instance-detail index', () => {
  it('exports process instance detail items', () => {
    expect(processInstanceDetail).toHaveProperty('ProcessInstanceDetailPage');
    expect(processInstanceDetail).toHaveProperty('ActivityDetailPanel');
    expect(processInstanceDetail).toHaveProperty('InstanceDetailSkeleton');
  });
});
