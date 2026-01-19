import { describe, it, expect } from 'vitest';
import { ProjectOverviewModals } from '@src/features/starbase/pages/components/ProjectOverviewModals';

describe('ProjectOverviewModals', () => {
  it('exports ProjectOverviewModals component', () => {
    expect(ProjectOverviewModals).toBeDefined();
    expect(typeof ProjectOverviewModals).toBe('function');
  });
});
