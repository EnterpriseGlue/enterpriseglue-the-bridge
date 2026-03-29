/**
 * Domain Layer
 * 
 * Pure business logic with zero external dependencies.
 * This layer contains:
 * - Models: Core domain types
 * - Policies: Pure functions for business rules
 * 
 * Import Rule: Domain can only import from domain/ or external libraries.
 * Never import from application/, infrastructure/, or interfaces/.
 */

// Git Domain
export type {
  Repository,
  GitProvider,
  Branch,
  CommitRef,
  GitAuthor,
  Commit,
  CommitStats,
  PullRequest,
  DiffEntry,
  FileContent,
  Namespace,
  GitCredentials,
} from './git/models.js';

export {
  validateRepoName,
  validateNamespace,
  validateBranchName,
  isProtectedBranch,
  areCredentialsExpired,
  getDefaultBranch,
  canAccessRepository,
  parseRepoPath,
  formatRepoPath,
  sortBranches,
  isValidCommitSha,
  getShortSha,
} from './git/policies.js';

// Notification Domain
export type {
  NotificationState,
  Notification,
  NotificationList,
  CreateNotificationRequest,
  MarkReadRequest,
  NotificationEvent,
  NotificationStreamConnection,
} from './notification/models.js';

export {
  validateCreateRequest,
  isUnread,
  markAsRead,
  filterByReadStatus,
  filterByState,
  sortByDate,
  paginate,
  countUnread,
  isStale,
  getNotificationsToPurge,
  validateNotificationIds,
  canAccessNotification,
  createSummary,
} from './notification/policies.js';

// PII Domain
export type {
  PiiType,
  PiiDetection,
  PiiDetectionResult,
  RedactionOptions,
  RedactionResult,
  PiiPolicy,
  PiiScanRequest,
  PiiScanBatchResult,
} from './pii/models.js';

export {
  DEFAULT_REDACTION_OPTIONS,
  isValidEmail,
  isValidCreditCard,
  isValidIban,
  calculateRiskScore,
  isAllowlisted,
  filterDetections,
  redactValue,
  redactContent,
  mergeOverlappingDetections,
  createDefaultPolicy,
  validatePolicy,
} from './pii/policies.js';
