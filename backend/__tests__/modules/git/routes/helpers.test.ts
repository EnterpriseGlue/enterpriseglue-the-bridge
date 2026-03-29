import { describe, it, expect } from 'vitest';
import {
  parseProviderId,
  resolveSafeGitOAuthRedirectUrl,
  mapGitProviderRepositoriesError,
  mapGitDeploymentError,
  mapGitSyncError,
} from '../../../../../packages/backend-host/src/modules/git/routes/helpers.js';

describe('git route helpers', () => {
  it('parses provider ids conservatively', () => {
    expect(parseProviderId(' github_1 ')).toBe('github_1');
    expect(parseProviderId('')).toBeNull();
    expect(parseProviderId('../bad')).toBeNull();
  });

  it('accepts only safe OAuth redirect hosts for the provider type', () => {
    expect(
      resolveSafeGitOAuthRedirectUrl(
        'github',
        'https://github.com/login/oauth/authorize?state=abc',
        null
      )
    ).toBe('https://github.com/login/oauth/authorize?state=abc');

    expect(
      resolveSafeGitOAuthRedirectUrl(
        'github',
        'https://evil.example.com/oauth?state=abc',
        null
      )
    ).toBeNull();
  });

  it('maps provider repository errors to stable response payloads', () => {
    expect(mapGitProviderRepositoriesError(new Error('Bad credentials'))).toEqual({
      status: 422,
      body: {
        error: 'Bad credentials - your saved token is invalid or expired. Please reconnect with a new token.',
        code: 'INVALID_TOKEN',
      },
    });

    expect(mapGitProviderRepositoriesError(new Error('scope missing'))).toEqual({
      status: 422,
      body: {
        error: 'Token does not have sufficient permissions. Required scope: repo',
        code: 'INSUFFICIENT_SCOPE',
      },
    });
  });

  it('maps deployment and sync errors to their route-specific response payloads', () => {
    expect(mapGitDeploymentError(new Error('No files to push'))).toEqual({
      status: 400,
      body: {
        error: 'No files to push',
        hint: 'Add at least one BPMN or DMN file to the project before pushing to Git',
      },
    });

    expect(mapGitSyncError(new Error('Unauthorized'))).toEqual({
      status: 401,
      body: {
        error: 'Git authentication failed — your access token may be expired or revoked',
        hint: 'Generate a new token from your Git provider and update it in Settings → Git Connections.',
      },
    });
  });
});
