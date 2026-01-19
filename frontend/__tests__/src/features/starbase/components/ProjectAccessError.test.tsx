import { describe, it, expect } from 'vitest';
import { ProjectAccessError } from '@src/features/starbase/components/ProjectAccessError';

describe('ProjectAccessError', () => {
  it('exports ProjectAccessError component', () => {
    expect(ProjectAccessError).toBeDefined();
    expect(typeof ProjectAccessError).toBe('function');
  });
});
