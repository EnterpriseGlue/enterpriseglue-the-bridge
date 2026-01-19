import { describe, it, expect } from 'vitest';
import * as projectDetail from '@src/features/starbase/components/project-detail';

describe('project-detail index', () => {
  it('exports project-detail module', () => {
    expect(projectDetail).toBeDefined();
    expect(typeof projectDetail).toBe('object');
  });
});
