import { describe, it, expect } from 'vitest';
import { ProjectOverviewTable } from '@src/features/starbase/pages/components/ProjectOverviewTable';

describe('ProjectOverviewTable', () => {
  it('exports ProjectOverviewTable component', () => {
    expect(ProjectOverviewTable).toBeDefined();
    expect(typeof ProjectOverviewTable).toBe('function');
  });
});
