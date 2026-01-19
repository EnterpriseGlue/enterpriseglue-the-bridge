import { describe, it, expect } from 'vitest';
import { ProjectContentsTable } from '@src/features/starbase/pages/components/ProjectContentsTable';

describe('ProjectContentsTable', () => {
  it('exports ProjectContentsTable component', () => {
    expect(ProjectContentsTable).toBeDefined();
    expect(typeof ProjectContentsTable).toBe('function');
  });
});
