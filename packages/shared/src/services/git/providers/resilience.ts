/**
 * Git Provider Resilience Utilities
 * Provides retry logic with exponential backoff, error classification, and timeout handling
 */

import { logger } from '@enterpriseglue/shared/utils/logger.js';

export type GitErrorType =
  | 'RATE_LIMIT'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface GitProviderError extends Error {
  type: GitErrorType;
  status?: number;
  retryable: boolean;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  timeoutMs: 30000,
};

/**
 * Classify an error from a Git provider API
 */
export function classifyGitError(error: any): GitProviderError {
  const status = error?.status || error?.response?.status || error?.code;
  const message = error?.message || 'Unknown error';

  let type: GitErrorType = 'UNKNOWN';
  let retryable = false;

  // Network/timeout errors
  if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED' || error?.type === 'timeout') {
    type = 'TIMEOUT';
    retryable = true;
  } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND' || error?.code === 'EAI_AGAIN') {
    type = 'NETWORK_ERROR';
    retryable = true;
  }
  // HTTP status codes
  else if (status === 401) {
    type = 'AUTHENTICATION';
    retryable = false;
  } else if (status === 403) {
    // 403 can be rate limit or insufficient permissions
    const isRateLimit = message.toLowerCase().includes('rate') ||
                       message.toLowerCase().includes('limit') ||
                       error?.response?.headers?.['x-ratelimit-remaining'] === '0';
    if (isRateLimit) {
      type = 'RATE_LIMIT';
      retryable = true;
    } else {
      type = 'AUTHORIZATION';
      retryable = false;
    }
  } else if (status === 404) {
    type = 'NOT_FOUND';
    retryable = false;
  } else if (status === 408) {
    type = 'TIMEOUT';
    retryable = true;
  } else if (status >= 500 && status < 600) {
    type = 'SERVER_ERROR';
    retryable = true;
  } else if (status === 429) {
    type = 'RATE_LIMIT';
    retryable = true;
  }

  const classifiedError = new Error(message) as GitProviderError;
  classifiedError.type = type;
  classifiedError.status = status;
  classifiedError.retryable = retryable;
  classifiedError.stack = error?.stack;

  return classifiedError;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential: 1s, 2s, 4s, 8s...
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  // Add jitter (±25%) to avoid thundering herd
  const jitter = 0.75 + Math.random() * 0.5;
  const delay = Math.min(exponentialDelay * jitter, maxDelayMs);
  return Math.round(delay);
}

/**
 * Execute a function with timeout
 */
function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error('Request timeout'), { code: 'ETIMEDOUT', type: 'TIMEOUT' }));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Execute an operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Apply timeout to each attempt
      const result = await withTimeout(operation, opts.timeoutMs);
      return result;
    } catch (error) {
      lastError = error;
      const classified = classifyGitError(error);

      // Don't retry non-retryable errors
      if (!classified.retryable) {
        throw classified;
      }

      // Don't retry after exhausting attempts
      if (attempt >= opts.maxRetries) {
        logger.error('Operation failed after max retries', {
          attempts: attempt + 1,
          errorType: classified.type,
          status: classified.status,
        });
        throw classified;
      }

      // Calculate and apply backoff delay
      const delay = calculateBackoff(attempt, opts.baseDelayMs, opts.maxDelayMs);

      logger.warn('Operation failed, retrying', {
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        errorType: classified.type,
        status: classified.status,
        delayMs: delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Should never reach here
  throw classifyGitError(lastError);
}

/**
 * Wrapper for Octokit-style clients with built-in resilience
 */
export function createResilientClient<T extends Record<string, any>>(
  client: T,
  options: RetryOptions = {}
): T {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };

  return new Proxy(client, {
    get(target, prop) {
      const value = target[prop as string];

      // Only wrap function calls
      if (typeof value === 'function') {
        return async (...args: any[]) => {
          return withRetry(() => value.apply(target, args), opts);
        };
      }

      // Handle nested objects (like client.rest.repos)
      if (typeof value === 'object' && value !== null) {
        return createResilientClient(value, opts);
      }

      return value;
    },
  });
}
