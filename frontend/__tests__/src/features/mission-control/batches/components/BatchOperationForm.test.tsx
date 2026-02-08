import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BatchOperationForm from '@src/features/mission-control/batches/components/BatchOperationForm';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@src/shared/hooks/useTenantNavigate', () => ({
  useTenantNavigate: () => ({
    tenantNavigate: vi.fn(),
    tenantSlug: 'default',
    effectivePathname: '/',
    navigate: vi.fn(),
    toTenantPath: (p: string) => p,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}));

describe('BatchOperationForm', () => {
  it('renders form with correct title for delete operation', () => {
    render(<BatchOperationForm operationType="delete" />);
    expect(screen.getByText('Cancel Process Instances')).toBeInTheDocument();
  });

  it('renders form with correct title for activate operation', () => {
    render(<BatchOperationForm operationType="activate" />);
    expect(screen.getByText('Activate Process Instances')).toBeInTheDocument();
  });

  it('renders retries field for retries operation', () => {
    render(<BatchOperationForm operationType="retries" />);
    expect(screen.getByLabelText(/Number of Retries/i)).toBeInTheDocument();
  });
});
