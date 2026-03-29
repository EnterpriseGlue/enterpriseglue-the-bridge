import { describe, it, expect, vi } from 'vitest';
import {
  classifyGitError,
  withRetry,
  createResilientClient,
  type GitErrorType,
} from '@enterpriseglue/shared/services/git/providers/resilience.js';

describe('classifyGitError', () => {
  it('classifies 401 as AUTHENTICATION error (non-retryable)', () => {
    const error = { status: 401, message: 'Unauthorized' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('AUTHENTICATION');
    expect(classified.retryable).toBe(false);
    expect(classified.status).toBe(401);
  });

  it('classifies 403 with rate limit message as RATE_LIMIT (retryable)', () => {
    const error = { status: 403, message: 'API rate limit exceeded' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('RATE_LIMIT');
    expect(classified.retryable).toBe(true);
  });

  it('classifies 403 without rate limit as AUTHORIZATION (non-retryable)', () => {
    const error = { status: 403, message: 'Forbidden' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('AUTHORIZATION');
    expect(classified.retryable).toBe(false);
  });

  it('classifies 429 as RATE_LIMIT (retryable)', () => {
    const error = { status: 429, message: 'Too many requests' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('RATE_LIMIT');
    expect(classified.retryable).toBe(true);
  });

  it('classifies 500+ as SERVER_ERROR (retryable)', () => {
    const error = { status: 503, message: 'Service unavailable' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('SERVER_ERROR');
    expect(classified.retryable).toBe(true);
  });

  it('classifies 404 as NOT_FOUND (non-retryable)', () => {
    const error = { status: 404, message: 'Not found' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('NOT_FOUND');
    expect(classified.retryable).toBe(false);
  });

  it('classifies network errors as NETWORK_ERROR (retryable)', () => {
    const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('NETWORK_ERROR');
    expect(classified.retryable).toBe(true);
  });

  it('classifies timeout errors as TIMEOUT (retryable)', () => {
    const error = { code: 'ETIMEDOUT', message: 'Request timeout' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('TIMEOUT');
    expect(classified.retryable).toBe(true);
  });

  it('classifies unknown errors as UNKNOWN', () => {
    const error = { message: 'Something weird happened' };
    const classified = classifyGitError(error);

    expect(classified.type).toBe('UNKNOWN');
  });
});

describe('withRetry', () => {
  it('returns result on successful operation', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withRetry(operation, { maxRetries: 2 });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors then succeeds', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce({ status: 503, message: 'Server error' })
      .mockResolvedValueOnce('success');

    const result = await withRetry(operation, { maxRetries: 2, baseDelayMs: 10 });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-retryable errors', async () => {
    const operation = vi.fn().mockRejectedValue({ status: 401, message: 'Unauthorized' });

    await expect(withRetry(operation, { maxRetries: 2 })).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries', async () => {
    const operation = vi.fn().mockRejectedValue({ status: 503, message: 'Server down' });

    await expect(withRetry(operation, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('respects timeout option', async () => {
    const operation = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500, 'success')));

    await expect(withRetry(operation, { maxRetries: 0, timeoutMs: 10 })).rejects.toMatchObject({ type: 'TIMEOUT' });
  });
});

describe('createResilientClient', () => {
  it('wraps client methods with retry logic', async () => {
    const mockClient = {
      getUser: vi.fn().mockResolvedValue({ id: '123', name: 'Test' }),
    };

    const resilientClient = createResilientClient(mockClient, { maxRetries: 2 });
    const result = await resilientClient.getUser();

    expect(result).toEqual({ id: '123', name: 'Test' });
    expect(mockClient.getUser).toHaveBeenCalledTimes(1);
  });

  it('retries failed method calls', async () => {
    const mockClient = {
      getUser: vi.fn()
        .mockRejectedValueOnce({ status: 503, message: 'Error' })
        .mockResolvedValueOnce({ id: '123' }),
    };

    const resilientClient = createResilientClient(mockClient, { maxRetries: 2, baseDelayMs: 10 });
    const result = await resilientClient.getUser();

    expect(result).toEqual({ id: '123' });
    expect(mockClient.getUser).toHaveBeenCalledTimes(2);
  });

  it('recursively wraps nested objects', async () => {
    const mockClient = {
      rest: {
        repos: {
          get: vi.fn().mockResolvedValue({ data: { name: 'test-repo' } }),
        },
      },
    };

    const resilientClient = createResilientClient(mockClient, { maxRetries: 2 });
    const result = await resilientClient.rest.repos.get();

    expect(result.data.name).toBe('test-repo');
  });
});
