import { describe, it, expect } from 'vitest';
import { ProjectMembersModal } from '@src/features/starbase/pages/components/ProjectMembersModal';

describe('ProjectMembersModal', () => {
  it('exports ProjectMembersModal component', () => {
    expect(ProjectMembersModal).toBeDefined();
    expect(typeof ProjectMembersModal).toBe('function');
  });
});
