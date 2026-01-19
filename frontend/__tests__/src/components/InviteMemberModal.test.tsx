import { describe, it, expect } from 'vitest';
import InviteMemberModal from '@src/components/InviteMemberModal';

describe('InviteMemberModal', () => {
  it('exports InviteMemberModal component', () => {
    expect(InviteMemberModal).toBeDefined();
    expect(typeof InviteMemberModal).toBe('function');
  });
});
