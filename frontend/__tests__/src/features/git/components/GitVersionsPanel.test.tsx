import { describe, it, expect } from 'vitest';
import GitVersionsPanel from '@src/features/git/components/GitVersionsPanel';

describe('GitVersionsPanel', () => {
  it('exports GitVersionsPanel component', () => {
    expect(GitVersionsPanel).toBeDefined();
    expect(typeof GitVersionsPanel).toBe('function');
  });
});
