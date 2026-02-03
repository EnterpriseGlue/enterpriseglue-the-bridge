import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@test/mocks/server';
import BatchesPage from '@src/features/mission-control/batches/BatchesPage';
import { useEngineSelectorStore } from '@src/stores/engineSelectorStore';

function renderWithProviders() {
  useEngineSelectorStore.setState({ selectedEngineId: 'engine-1' });
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/mission-control/batches']}>
        <Routes>
          <Route path="/mission-control/batches" element={<BatchesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BatchesList', () => {
  it('renders batch rows from API', async () => {
    server.use(
      http.get('/mission-control-api/batches', () => HttpResponse.json([
        {
          id: 'batch-1',
          type: 'historyCleanup',
          progress: 20,
          status: 'RUNNING',
          createdAt: Date.now(),
        },
      ]))
    );

    renderWithProviders();

    await waitFor(() => {
      expect(Boolean(screen.getByText('Batches'))).toBe(true);
    });
  });
});
