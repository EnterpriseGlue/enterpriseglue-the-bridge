/**
 * Git Provider Factory
 * Creates the appropriate client based on provider type
 */

export * from './types.js';
export { GitHubClient } from './GitHubClient.js';
export { GitLabClient } from './GitLabClient.js';
export { BitbucketClient } from './BitbucketClient.js';
export { AzureDevOpsClient } from './AzureDevOpsClient.js';

import type { GitProviderClient, ProviderType, ProviderCredentials } from './types.js';
import { GitHubClient } from './GitHubClient.js';
import { GitLabClient } from './GitLabClient.js';
import { BitbucketClient } from './BitbucketClient.js';
import { AzureDevOpsClient } from './AzureDevOpsClient.js';

/**
 * Create a Git provider client based on provider type
 */
export function createGitProviderClient(
  type: ProviderType,
  credentials: ProviderCredentials,
  options?: { host?: string }
): GitProviderClient {
  switch (type) {
    case 'github':
      return new GitHubClient(credentials);
    case 'gitlab':
      return new GitLabClient(credentials, options?.host);
    case 'bitbucket':
      return new BitbucketClient(credentials);
    case 'azure-devops':
      return new AzureDevOpsClient(credentials);
    default:
      throw new Error(`Unsupported provider type: ${type}`);
  }
}

/**
 * Detect provider type from URL
 */
export function detectProviderFromUrl(url: string): ProviderType | null {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('github.com') || lowerUrl.includes('github.')) {
    return 'github';
  }
  if (lowerUrl.includes('gitlab.com') || lowerUrl.includes('gitlab.')) {
    return 'gitlab';
  }
  if (lowerUrl.includes('bitbucket.org') || lowerUrl.includes('bitbucket.')) {
    return 'bitbucket';
  }
  if (lowerUrl.includes('dev.azure.com') || lowerUrl.includes('visualstudio.com')) {
    return 'azure-devops';
  }
  
  return null;
}
