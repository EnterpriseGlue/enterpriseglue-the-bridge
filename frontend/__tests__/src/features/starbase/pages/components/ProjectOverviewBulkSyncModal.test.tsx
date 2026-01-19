import { describe, it, expect } from 'vitest';
import { ProjectOverviewBulkSyncModal } from '@src/features/starbase/pages/components/ProjectOverviewBulkSyncModal';

describe('ProjectOverviewBulkSyncModal', () => {
  it('exports ProjectOverviewBulkSyncModal component', () => {
    expect(ProjectOverviewBulkSyncModal).toBeDefined();
    expect(typeof ProjectOverviewBulkSyncModal).toBe('function');
  });
});
