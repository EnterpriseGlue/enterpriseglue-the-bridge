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
      defsQ: { data: [{ id: 'def-1', key: 'order-process', name: 'Order Process', version: 1 }] },
      defItems: [{ id: 'order-process', label: 'Order Process', key: 'order-process', version: 1 }],
      versions: [1],
      currentKey: 'order-process',
      defIdForVersion: 'def-1',
      xmlQ: { data: null, isLoading: false },
      countsQ: { data: null, isLoading: false },
      countsByStateQ: { data: null, isLoading: false },
      previewCountQ: { data: null, isLoading: false },
      instQ: {
        data: [
          {
            id: 'inst-1',
            processDefinitionKey: 'order-process',
            state: 'ACTIVE',
            startTime: new Date().toISOString(),
          },
        ],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      },
      defIdQ: { data: 'def-1', isLoading: false },
    }),
    useProcessesModalData: () => ({
      allRetryItems: [],
      retryJobsQ: { data: [], isLoading: false, error: null, refetch: vi.fn() },
      retryExtTasksQ: { data: [], isLoading: false, error: null, refetch: vi.fn() },
      varsQ: { data: [], isLoading: false },
      histQ: { data: [], isLoading: false },
    }),
    useBulkOperations: () => ({
      bulkDeleteModal: { isOpen: false, data: null },
      bulkRetryModal: { isOpen: false },
      bulkSuspendModal: { isOpen: false },
      bulkActivateModal: { isOpen: false },
      bulkRetryBusy: false,
      bulkActivateBusy: false,
      bulkSuspendBusy: false,
      bulkDeleteBusy: false,
      bulkRetry: vi.fn(),
      bulkDelete: vi.fn(),
      bulkSuspend: vi.fn(),
      bulkActivate: vi.fn(),
      callAction: vi.fn().mockResolvedValue(null),
    }),
    useRetryModal: () => ({
      retryItems: [],
      retrySelectionMap: {},
      setRetrySelectionMap: vi.fn(),
      retryDueMode: 'relative',
      setRetryDueMode: vi.fn(),
      retryDueInput: '',
      setRetryDueInput: vi.fn(),
      retryModalBusy: false,
      setRetryModalBusy: vi.fn(),
      retryModalError: null,
      setRetryModalError: vi.fn(),
      retryModalSuccess: null,
      setRetryModalSuccess: vi.fn(),
    }),
    useSplitPaneState: actual.useSplitPaneState,
  };
});

describe('ProcessesOverviewPage state', () => {
  it('renders suspend action for active instance', async () => {
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
      expect(screen.getByLabelText('Suspend')).toBeInTheDocument();
    });
  });
});
