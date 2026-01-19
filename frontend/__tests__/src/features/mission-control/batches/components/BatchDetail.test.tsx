import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BatchDetail from '@src/features/mission-control/batches/components/BatchDetail';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ batchId: 'b1' }),
    useNavigate: () => vi.fn(),
  };
});

describe('BatchDetail', () => {
  it('renders batch details when data is loaded', async () => {
    const { useQuery } = await import('@tanstack/react-query');
    (useQuery as any).mockReturnValue({
      data: {
        batch: { id: 'b1', type: 'DELETE_INSTANCES', status: 'RUNNING', progress: 50 },
        statistics: { completedJobs: 5, failedJobs: 0, remainingJobs: 5 },
      },
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BatchDetail />
      </MemoryRouter>
    );

    expect(screen.getByText(/Batch b1/i)).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });
});
