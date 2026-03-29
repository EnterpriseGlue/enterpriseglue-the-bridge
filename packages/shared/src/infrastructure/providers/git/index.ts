/**
 * Infrastructure - Git Providers
 * 
 * Git provider client implementations.
 * Re-exported from legacy services/git/providers during migration.
 * 
 * @deprecated Use @shared/infrastructure/providers/git directly
 */

export { BaseGitProvider } from '../../../services/git/providers/BaseProvider.js';
export type { PullRequestParams, PullRequest, Repository, CreateRepositoryParams } from '../../../services/git/providers/BaseProvider.js';
export { GitHubClient } from '../../../services/git/providers/GitHubClient.js';
export { GitLabClient } from '../../../services/git/providers/GitLabClient.js';
export { BitbucketClient } from '../../../services/git/providers/BitbucketClient.js';
export { AzureDevOpsClient } from '../../../services/git/providers/AzureDevOpsClient.js';
export { createGitProviderClient, detectProviderFromUrl } from '../../../services/git/providers/index.js';
export type { 
  ProviderType,
  ProviderCredentials,
  RepoInfo,
  BranchInfo,
  FileEntry,
  TreeEntry,
  CommitInfo,
  CreateRepoOptions,
  PushOptions,
  PullOptions,
  PullResult,
  Namespace,
  GitProviderClient,
} from '../../../services/git/providers/types.js';
export {
  createResilientClient,
  withRetry,
  classifyGitError,
} from '../../../services/git/providers/resilience.js';
export type { 
  RetryOptions,
  GitProviderError,
  GitErrorType,
} from '../../../services/git/providers/resilience.js';
