import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useGitRepositories, useGitRepository, useHasGitRepository } from '@src/features/git/hooks/useGitRepository';
import { gitApi } from '@src/features/git/api/gitApi';

vi.mock('@src/features/git/api/gitApi', () => ({
  gitApi: {
    getRepositories: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
  return Wrapper;
};

describe('useGitRepositories', () => {
  it('fetches repositories', async () => {
    (gitApi.getRepositories as any).mockResolvedValue([
      { id: 'r1', projectId: 'p1', remoteUrl: 'https://github.com/test/repo' },
    ]);

    const { result } = renderHook(() => useGitRepositories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useGitRepository', () => {
  it('finds repository for project', async () => {
    (gitApi.getRepositories as any).mockResolvedValue([
      { id: 'r1', projectId: 'p1', remoteUrl: 'https://github.com/test/repo' },
    ]);

    const { result } = renderHook(() => useGitRepository('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('r1');
  });

  it('returns null when no repository found', async () => {
    (gitApi.getRepositories as any).mockResolvedValue([]);

    const { result } = renderHook(() => useGitRepository('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useHasGitRepository', () => {
  it('returns true when repository exists', async () => {
    (gitApi.getRepositories as any).mockResolvedValue([
      { id: 'r1', projectId: 'p1', remoteUrl: 'https://github.com/test/repo' },
    ]);

    const { result } = renderHook(() => useHasGitRepository('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false when repository does not exist', async () => {
    (gitApi.getRepositories as any).mockResolvedValue([]);

    const { result } = renderHook(() => useHasGitRepository('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(false));
  });
});
