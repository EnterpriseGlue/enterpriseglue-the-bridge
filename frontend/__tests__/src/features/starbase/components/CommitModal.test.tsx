import { describe, it, expect } from 'vitest';
import CommitModal from '@src/features/starbase/components/CommitModal';

describe('CommitModal', () => {
  it('exports CommitModal component', () => {
    expect(CommitModal).toBeDefined();
    expect(typeof CommitModal).toBe('function');
  });
});
