import { describe, it, expect } from 'vitest';
import SyncModal from '@src/features/git/components/SyncModal';

describe('Git SyncModal', () => {
  it('exports SyncModal component', () => {
    expect(SyncModal).toBeDefined();
    expect(typeof SyncModal).toBe('function');
  });
});
