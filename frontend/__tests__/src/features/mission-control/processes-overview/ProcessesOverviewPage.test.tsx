import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProcessesOverviewPage from '@src/features/mission-control/processes-overview/ProcessesOverviewPage';

vi.mock('@src/components/EngineSelector', () => ({
  useSelectedEngine: () => null,
}));

vi.mock('@src/features/mission-control/processes-overview/hooks', async () => {
  const actual = await vi.importActual<typeof import('@src/features/mission-control/processes-overview/hooks')>('@src/features/mission-control/processes-overview/hooks');
  return {
    ...actual,
    useProcessesData: () => ({
      defsQ: { data: [] },
      defItems: [],
      versions: [],
      currentKey: '',
      defIdForVersion: null,
      xmlQ: { data: null, isLoading: false },
      countsQ: { data: null, isLoading: false },
      countsByStateQ: { data: null, isLoading: false },
      previewCountQ: { data: null, isLoading: false },
      instQ: { data: [], isLoading: false, isError: false, refetch: vi.fn() },
      defIdQ: { data: null },
    }),
    useProcessesModalData: () => ({
      allRetryItems: [],
      retryJobsQ: { data: [] },
      retryExtTasksQ: { data: [] },
      varsQ: { data: [], isLoading: false },
      histQ: { data: [], isLoading: false },
    }),
    useBulkOperations: () => ({
      bulkDeleteModal: { isOpen: false, data: null },
    }),
    useRetryModal: () => ({
      retryItems: [],
    }),
    useSplitPaneState: actual.useSplitPaneState,
  };
});

describe('ProcessesOverviewPage', () => {
  it('renders processes overview header', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/mission-control/processes']}>
          <ProcessesOverviewPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Processes')).toBeInTheDocument();
    });
  });
});
