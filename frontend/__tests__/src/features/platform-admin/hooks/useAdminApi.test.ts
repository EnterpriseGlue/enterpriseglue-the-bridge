import { describe, it, expect } from 'vitest';
import {
  adminQueryKeys,
  usePlatformSettings,
  useUpdatePlatformSettings,
  useEnvironmentTags,
  useAdminUsers,
  useProjectsGovernance,
  useAdminGitProviders,
} from '@src/features/platform-admin/hooks/useAdminApi';

describe('useAdminApi', () => {
  it('exports admin query keys', () => {
    expect(adminQueryKeys.settings).toEqual(['platform-admin', 'admin', 'settings']);
    expect(adminQueryKeys.environments).toEqual(['platform-admin', 'admin', 'environments']);
    expect(adminQueryKeys.gitProviders).toEqual(['platform-admin', 'admin', 'git-providers']);
  });

  it('exports admin hooks', () => {
    expect(typeof usePlatformSettings).toBe('function');
    expect(typeof useUpdatePlatformSettings).toBe('function');
    expect(typeof useEnvironmentTags).toBe('function');
    expect(typeof useAdminUsers).toBe('function');
    expect(typeof useProjectsGovernance).toBe('function');
    expect(typeof useAdminGitProviders).toBe('function');
  });
});
