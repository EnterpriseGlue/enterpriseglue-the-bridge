export interface RouteErrorResponse<TBody> {
  status: number;
  body: TBody;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || '');
}

function includesAny(message: string, needles: string[]): boolean {
  return needles.some((needle) => message.includes(needle));
}

export function parseProviderId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function getAllowedOAuthHosts(providerType: string, oauthAuthUrl?: string | null): string[] {
  const hosts: string[] = [];

  const addHost = (urlStr?: string | null) => {
    if (!urlStr) return;
    try {
      const parsed = new URL(urlStr);
      if (parsed.hostname) hosts.push(parsed.hostname);
    } catch {
      return;
    }
  };

  addHost(oauthAuthUrl);

  const normalizedType = String(providerType || '').toLowerCase();
  if (normalizedType === 'github') hosts.push('github.com');
  if (normalizedType === 'gitlab') hosts.push('gitlab.com');
  if (normalizedType === 'bitbucket') hosts.push('bitbucket.org');
  if (normalizedType === 'azure-devops') hosts.push('visualstudio.com');

  return Array.from(new Set(hosts.filter(Boolean)));
}

export function getSafeRedirectUrl(url: string, allowedHosts: string[]): string | null {
  try {
    const parsed = new URL(url);
    if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && allowedHosts.includes(parsed.hostname)) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveSafeGitOAuthRedirectUrl(
  providerType: string,
  authUrl: string,
  oauthAuthUrl?: string | null
): string | null {
  return getSafeRedirectUrl(authUrl, getAllowedOAuthHosts(providerType, oauthAuthUrl));
}

export function mapGitProviderRepositoriesError(error: unknown): RouteErrorResponse<{ error: string; code: string }> | null {
  const message = getErrorMessage(error);

  if (includesAny(message, ['Bad credentials', '401'])) {
    return {
      status: 422,
      body: {
        error: 'Bad credentials - your saved token is invalid or expired. Please reconnect with a new token.',
        code: 'INVALID_TOKEN',
      },
    };
  }

  if (includesAny(message, ['rate limit', '403'])) {
    return {
      status: 429,
      body: {
        error: 'API rate limit exceeded. Please try again later.',
        code: 'RATE_LIMITED',
      },
    };
  }

  if (includesAny(message, ['scope', 'permission'])) {
    return {
      status: 422,
      body: {
        error: 'Token does not have sufficient permissions. Required scope: repo',
        code: 'INSUFFICIENT_SCOPE',
      },
    };
  }

  return null;
}

export function mapGitDeploymentError(error: unknown): RouteErrorResponse<{ error: string; hint: string }> {
  const message = getErrorMessage(error);

  if (message.includes('Project is not connected to Git')) {
    return {
      status: 400,
      body: {
        error: 'Project is not connected to Git',
        hint: 'Open the project → (⋯) → Git Settings to connect a repository and provide a service token.',
      },
    };
  }

  if (message.includes('No Git credentials found')) {
    return {
      status: 403,
      body: {
        error: 'No Git credentials found for this provider',
        hint: 'Ask a project admin to update the service token in Project → (⋯) → Git Settings.',
      },
    };
  }

  if (message.includes('No files to push')) {
    return {
      status: 400,
      body: {
        error: 'No files to push',
        hint: 'Add at least one BPMN or DMN file to the project before pushing to Git',
      },
    };
  }

  if (includesAny(message, ['not accessible by personal access token', 'Resource not accessible'])) {
    return {
      status: 403,
      body: {
        error: 'The service token does not have sufficient permissions to push to this repository',
        hint: 'Update the token in Project → (⋯) → Git Settings. For fine-grained tokens enable "Contents: Read and write", for classic tokens enable the "repo" scope.',
      },
    };
  }

  if (includesAny(message, ['Bad credentials', '401', 'Unauthorized'])) {
    return {
      status: 401,
      body: {
        error: 'Git authentication failed — the service token may be expired or revoked',
        hint: 'Ask a project admin to generate a new token and update it in Project → (⋯) → Git Settings.',
      },
    };
  }

  if (includesAny(message, ['rate limit', 'API rate limit'])) {
    return {
      status: 429,
      body: {
        error: 'Git provider API rate limit exceeded',
        hint: 'Wait a few minutes and try again, or use a token with higher rate limits.',
      },
    };
  }

  if (message.includes('Not Found') && includesAny(message, ['repository', '404'])) {
    return {
      status: 404,
      body: {
        error: 'The linked Git repository was not found — it may have been deleted or renamed',
        hint: 'Check that the repository still exists on your Git provider, then reconnect if needed.',
      },
    };
  }

  if (includesAny(message, ['fetch', 'ECONNREFUSED', 'ETIMEDOUT', 'network'])) {
    return {
      status: 502,
      body: {
        error: 'Could not reach the Git provider — network or service issue',
        hint: 'Check your internet connection and that the Git provider is available, then try again.',
      },
    };
  }

  return {
    status: 500,
    body: {
      error: message || 'Deployment failed due to an unexpected error',
      hint: 'Check your Git connection settings and token permissions, then try again.',
    },
  };
}

export function mapGitSyncError(error: unknown): RouteErrorResponse<{ error: string; hint: string }> {
  const message = getErrorMessage(error);

  if (includesAny(message, ['not accessible by personal access token', 'Resource not accessible'])) {
    return {
      status: 403,
      body: {
        error: 'Your personal access token does not have sufficient permissions',
        hint: 'Update your token permissions: for fine-grained tokens enable "Contents: Read and write", for classic tokens enable the "repo" scope. Then update the token in Settings → Git Connections.',
      },
    };
  }

  if (includesAny(message, ['Bad credentials', 'Unauthorized'])) {
    return {
      status: 401,
      body: {
        error: 'Git authentication failed — your access token may be expired or revoked',
        hint: 'Generate a new token from your Git provider and update it in Settings → Git Connections.',
      },
    };
  }

  if (includesAny(message, ['rate limit', 'API rate limit'])) {
    return {
      status: 429,
      body: {
        error: 'Git provider API rate limit exceeded',
        hint: 'Wait a few minutes and try again.',
      },
    };
  }

  if (includesAny(message, ['ECONNREFUSED', 'ETIMEDOUT', 'network'])) {
    return {
      status: 502,
      body: {
        error: 'Could not reach the Git provider — network or service issue',
        hint: 'Check your internet connection and try again.',
      },
    };
  }

  return {
    status: 500,
    body: {
      error: message || 'Sync failed due to an unexpected error',
      hint: 'Check your Git connection settings and token permissions, then try again.',
    },
  };
}
