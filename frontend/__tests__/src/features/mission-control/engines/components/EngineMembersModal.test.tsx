import { describe, it, expect } from 'vitest';
import EngineMembersModal from '@src/features/mission-control/engines/components/EngineMembersModal';

describe('EngineMembersModal', () => {
  it('exports EngineMembersModal component', () => {
    expect(EngineMembersModal).toBeDefined();
    expect(typeof EngineMembersModal).toBe('function');
  });
});
