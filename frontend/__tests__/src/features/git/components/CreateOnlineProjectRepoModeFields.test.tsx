import { describe, it, expect } from 'vitest';
import { CreateOnlineProjectRepoModeFields } from '@src/features/git/components/CreateOnlineProjectRepoModeFields';

describe('CreateOnlineProjectRepoModeFields', () => {
  it('exports CreateOnlineProjectRepoModeFields component', () => {
    expect(CreateOnlineProjectRepoModeFields).toBeDefined();
    expect(typeof CreateOnlineProjectRepoModeFields).toBe('function');
  });
});
