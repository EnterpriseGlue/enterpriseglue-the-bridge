import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Decisions from '@src/features/mission-control/decisions-overview/components/Decisions';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useLocation: () => ({ state: null }),
}));

vi.mock('@src/shared/hooks/useTenantNavigate', () => ({
  useTenantNavigate: () => ({
    tenantNavigate: vi.fn(),
    toTenantPath: (p: string) => p,
    tenantSlug: 'default',
    effectivePathname: '/',
    navigate: vi.fn(),
  }),
}));

vi.mock('@src/features/mission-control/shared/stores/decisionsFilterStore', () => ({
  useDecisionsFilterStore: () => ({
    selectedDefinition: null,
    selectedVersion: null,
    selectedStates: [],
    searchValue: '',
    dateFrom: '',
    dateTo: '',
    timeFrom: '',
    timeTo: '',
    setSelectedDefinition: vi.fn(),
    setSelectedVersion: vi.fn(),
    setSelectedStates: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ isLoading: false, data: [] }),
}));

vi.mock('react-split-pane', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@src/features/mission-control/decisions-overview/components/DecisionsDataTable', () => ({
  DecisionsDataTable: () => <div>Decisions table</div>,
}));

vi.mock('@src/shared/components/PageLoader', () => ({
  PageLoader: ({ children }: any) => <div>{children}</div>,
}));

describe('Decisions component', () => {
  it('renders empty decision selection prompt', () => {
    render(<Decisions />);
    expect(screen.getByText('To view a Decision Table, select a Decision in the Filters panel')).toBeInTheDocument();
  });
});
