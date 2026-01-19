import { describe, it, expect } from 'vitest';
import { ProjectDetailHeader } from '@src/features/starbase/pages/components/ProjectDetailHeader';

describe('ProjectDetailHeader', () => {
  it('exports ProjectDetailHeader component', () => {
    expect(ProjectDetailHeader).toBeDefined();
    expect(typeof ProjectDetailHeader).toBe('function');
  });
});
