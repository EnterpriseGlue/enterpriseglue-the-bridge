import { describe, it, expect } from 'vitest';
import CommentsPanel from '@src/features/starbase/components/CommentsPanel';

describe('CommentsPanel', () => {
  it('exports CommentsPanel component', () => {
    expect(CommentsPanel).toBeDefined();
    expect(typeof CommentsPanel).toBe('function');
  });
});
