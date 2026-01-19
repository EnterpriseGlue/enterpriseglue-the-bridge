import { describe, it, expect } from 'vitest';
import * as gitComponents from '../../../../src/features/git/components';

describe('git components index', () => {
  it('exports git components', () => {
    expect(gitComponents).toHaveProperty('DeployButton');
    expect(gitComponents).toHaveProperty('DeployDialog');
    expect(gitComponents).toHaveProperty('GitVersionsPanel');
    expect(gitComponents).toHaveProperty('CreateOnlineProjectModal');
    expect(gitComponents).toHaveProperty('SyncModal');
  });
});
