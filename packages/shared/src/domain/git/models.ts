/**
 * Git Domain Models
 * 
 * Pure domain types with no external dependencies.
 * These represent the core concepts of the Git versioning domain.
 */

export interface Repository {
  id: string;
  provider: GitProvider;
  namespace: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type GitProvider = 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';

export interface Branch {
  name: string;
  commit: CommitRef;
  isDefault: boolean;
  isProtected: boolean;
}

export interface CommitRef {
  sha: string;
  message: string;
  author: GitAuthor;
  date: Date;
}

export interface GitAuthor {
  name: string;
  email: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: GitAuthor;
  committer: GitAuthor;
  date: Date;
  parents: string[];
  stats?: CommitStats;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  changes: number;
}

export interface PullRequest {
  id: string | number;
  number: number;
  title: string;
  description: string | null;
  sourceBranch: string;
  targetBranch: string;
  state: 'open' | 'closed' | 'merged';
  author: GitAuthor;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  closedAt?: Date;
}

export interface DiffEntry {
  path: string;
  changeType: 'add' | 'modify' | 'delete' | 'rename';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
  size: number;
  sha: string;
}

export interface Namespace {
  id: string;
  name: string;
  path: string;
  kind: 'user' | 'organization' | 'group';
}

export interface GitCredentials {
  provider: GitProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope: string[];
}
