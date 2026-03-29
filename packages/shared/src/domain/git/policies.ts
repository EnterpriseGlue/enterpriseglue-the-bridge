/**
 * Git Domain Policies
 * 
 * Pure functions for business logic validation and rules.
 * No external dependencies - only operates on domain models.
 */

import type { GitProvider, Repository, Branch, Commit, GitCredentials } from './models.js';

/**
 * Validate a repository name according to Git provider rules
 */
export function validateRepoName(name: string): boolean {
  // GitHub: alphanumeric, hyphens, underscores, periods. No consecutive special chars.
  // Max 100 chars
  if (!name || name.length === 0 || name.length > 100) {
    return false;
  }
  
  // Cannot start or end with special chars
  if (/^[-_.]|[_.-]$/.test(name)) {
    return false;
  }
  
  // Only allowed characters
  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
    return false;
  }
  
  // No consecutive special characters
  if (/[-_.]{2,}/.test(name)) {
    return false;
  }
  
  return true;
}

/**
 * Validate a namespace path (username/org)
 */
export function validateNamespace(path: string): boolean {
  // Similar rules to repo name but more permissive
  if (!path || path.length === 0 || path.length > 39) {
    return false;
  }
  
  // Cannot start with hyphen
  if (path.startsWith('-')) {
    return false;
  }
  
  // Alphanumeric and hyphens only (for GitHub-style)
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(path);
}

/**
 * Check if a branch name is valid
 */
export function validateBranchName(name: string): boolean {
  // Git branch naming rules
  if (!name || name.length === 0) {
    return false;
  }
  
  // Cannot contain special sequences
  if (name.includes('..') || name.includes('//') || name.includes('@{')) {
    return false;
  }
  
  // Cannot start with . or -
  if (name.startsWith('.') || name.startsWith('-')) {
    return false;
  }
  
  // Cannot end with .lock or /
  if (name.endsWith('.lock') || name.endsWith('/')) {
    return false;
  }
  
  // No control characters
  if (/[\x00-\x1F\x7F]/.test(name)) {
    return false;
  }
  
  return true;
}

/**
 * Determine if a branch is protected based on naming conventions
 */
export function isProtectedBranch(branchName: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Exact match
    if (pattern === branchName) {
      return true;
    }
    
    // Wildcard pattern (e.g., "release/*")
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(branchName)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate if credentials are expired or about to expire
 */
export function areCredentialsExpired(
  credentials: Pick<GitCredentials, 'expiresAt'>,
  bufferMinutes: number = 5
): boolean {
  if (!credentials.expiresAt) {
    // No expiration = never expired (e.g., personal access tokens)
    return false;
  }
  
  const now = new Date();
  const buffer = bufferMinutes * 60 * 1000;
  
  return credentials.expiresAt.getTime() - buffer <= now.getTime();
}

/**
 * Determine the default branch to use
 */
export function getDefaultBranch(branches: Branch[]): Branch | undefined {
  // First try to find branch marked as default
  const defaultBranch = branches.find(b => b.isDefault);
  if (defaultBranch) {
    return defaultBranch;
  }
  
  // Fallback to 'main' or 'master'
  return branches.find(b => b.name === 'main') || 
         branches.find(b => b.name === 'master');
}

/**
 * Check if a repository is accessible given credentials
 * (basic check - full validation requires provider-specific logic)
 */
export function canAccessRepository(
  repo: Pick<Repository, 'isPrivate'>,
  hasCredentials: boolean
): boolean {
  if (!repo.isPrivate) {
    return true; // Public repos are always accessible
  }
  
  return hasCredentials; // Private repos require credentials
}

/**
 * Parse a full repository path (namespace/name) into components
 */
export function parseRepoPath(fullPath: string): { namespace: string; name: string } | null {
  const parts = fullPath.split('/');
  
  if (parts.length !== 2) {
    return null;
  }
  
  const [namespace, name] = parts;
  
  if (!validateNamespace(namespace) || !validateRepoName(name)) {
    return null;
  }
  
  return { namespace, name };
}

/**
 * Format a full repository path from components
 */
export function formatRepoPath(namespace: string, name: string): string {
  return `${namespace}/${name}`;
}

/**
 * Sort branches by importance (default first, then alphabetical)
 */
export function sortBranches(branches: Branch[]): Branch[] {
  return [...branches].sort((a, b) => {
    // Default branch always first
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    
    // Then protected branches
    if (a.isProtected && !b.isProtected) return -1;
    if (!a.isProtected && b.isProtected) return 1;
    
    // Then alphabetical
    return a.name.localeCompare(b.name);
  });
}

/**
 * Check if a commit SHA is valid format
 */
export function isValidCommitSha(sha: string): boolean {
  // SHA-1: 40 hex chars, or short form (min 4 chars)
  if (!sha) return false;
  
  return /^[a-f0-9]{4,40}$/i.test(sha);
}

/**
 * Get the short SHA (first 7 chars) for display
 */
export function getShortSha(sha: string): string {
  return sha.slice(0, 7);
}
