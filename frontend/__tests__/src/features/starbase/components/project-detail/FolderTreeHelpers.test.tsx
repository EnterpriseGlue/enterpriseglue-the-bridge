import { describe, it, expect } from 'vitest';
import * as FolderTreeHelpers from '@src/features/starbase/components/project-detail/FolderTreeHelpers';

describe('FolderTreeHelpers', () => {
  it('exports FolderTreeHelpers module', () => {
    expect(FolderTreeHelpers).toBeDefined();
    expect(typeof FolderTreeHelpers).toBe('object');
  });
});
