import { describe, it, expect } from 'vitest';
import * as processesOverview from '../../../../src/features/mission-control/processes-overview';

describe('processes-overview index', () => {
  it('exports processes overview modules', () => {
    expect(processesOverview).toHaveProperty('ProcessesOverviewPage');
    expect(processesOverview).toHaveProperty('ProcessesDataTable');
    expect(processesOverview).toHaveProperty('ProcessesSkeleton');
  });
});
