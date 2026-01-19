import { describe, it, expect, vi } from 'vitest';
import { GitService } from '../../../../src/shared/services/git/GitService.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn().mockResolvedValue({
    getRepository: vi.fn().mockReturnValue({
      save: vi.fn(),
      findOne: vi.fn(),
    }),
  }),
}));

vi.mock('@shared/services/versioning/index.js', () => ({
  vcsService: {},
}));

vi.mock('@shared/services/git/RemoteGitService.js', () => ({
  remoteGitService: {},
}));

vi.mock('@shared/services/git/CredentialService.js', () => ({
  credentialService: {},
}));

vi.mock('@shared/services/platform-admin/PlatformSettingsService.js', () => ({
  platformSettingsService: {},
}));

describe('GitService', () => {
  it('creates instance', () => {
    const service = new GitService();
    expect(service).toBeDefined();
  });
});
