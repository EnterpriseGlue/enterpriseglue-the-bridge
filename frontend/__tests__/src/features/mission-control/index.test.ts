import { describe, it, expect } from 'vitest';
import * as missionControlModule from '@src/features/mission-control/index';

describe('mission-control index', () => {
  it('exports mission-control pages and components', () => {
    expect(missionControlModule.ProcessesOverviewPage).toBeDefined();
    expect(missionControlModule.ProcessInstanceDetailPage).toBeDefined();
    expect(missionControlModule.BatchesPage).toBeDefined();
    expect(missionControlModule.MigrationWizardPage).toBeDefined();
    expect(missionControlModule.EnginesPage).toBeDefined();
    expect(missionControlModule.Decisions).toBeDefined();
    expect(missionControlModule.DecisionHistoryDetail).toBeDefined();
  });
});
