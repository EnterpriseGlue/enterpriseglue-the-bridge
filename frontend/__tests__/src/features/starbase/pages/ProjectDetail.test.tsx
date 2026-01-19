import { describe, it, expect } from 'vitest';
import ProjectDetail from '@src/features/starbase/pages/ProjectDetail';

describe('ProjectDetail', () => {
  it('exports ProjectDetail page component', () => {
    expect(ProjectDetail).toBeDefined();
    expect(typeof ProjectDetail).toBe('function');
  });
});
