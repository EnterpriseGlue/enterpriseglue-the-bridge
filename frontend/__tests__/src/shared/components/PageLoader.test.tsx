import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageLoader, usePageLoader, withLoadingSkeleton } from '@src/shared/components/PageLoader';

vi.mock('@src/features/mission-control/processes-overview/components/ProcessesSkeleton', () => ({
  ProcessesSkeleton: () => <div>Processes Skeleton</div>,
}));

vi.mock('@src/features/mission-control/process-instance-detail/components/InstanceDetailSkeleton', () => ({
  InstanceDetailSkeleton: () => <div>Instance Detail Skeleton</div>,
}));

vi.mock('@src/shared/components/LoadingSkeleton', () => ({
  LoadingSkeleton: ({ type }: { type: string }) => <div>Loading {type}</div>,
  PageSkeleton: () => <div>Page Skeleton</div>,
}));

describe('PageLoader', () => {
  it('renders children when not loading', () => {
    render(
      <MemoryRouter>
        <PageLoader isLoading={false}>
          <div>Content</div>
        </PageLoader>
      </MemoryRouter>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows processes skeleton for mission-control route', () => {
    render(
      <MemoryRouter initialEntries={['/mission-control']}>
        <PageLoader isLoading={true}>
          <div>Content</div>
        </PageLoader>
      </MemoryRouter>
    );

    expect(screen.getByText('Processes Skeleton')).toBeInTheDocument();
  });

  it('shows instance detail skeleton for instance route', () => {
    render(
      <MemoryRouter initialEntries={['/mission-control/instance/123']}>
        <PageLoader isLoading={true}>
          <div>Content</div>
        </PageLoader>
      </MemoryRouter>
    );

    expect(screen.getByText('Instance Detail Skeleton')).toBeInTheDocument();
  });

  it('shows table skeleton when specified', () => {
    render(
      <MemoryRouter>
        <PageLoader isLoading={true} skeletonType="table" rows={5}>
          <div>Content</div>
        </PageLoader>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading table')).toBeInTheDocument();
  });
});

describe('usePageLoader', () => {
  it('returns PageContent wrapper', () => {
    const Wrapper = () => {
      const { PageContent } = usePageLoader(true, 'page');
      return (
        <PageContent>
          <div>Wrapped</div>
        </PageContent>
      );
    };

    render(
      <MemoryRouter>
        <Wrapper />
      </MemoryRouter>
    );

    expect(screen.getByText('Page Skeleton')).toBeInTheDocument();
  });
});

describe('withLoadingSkeleton', () => {
  it('wraps component with PageLoader', () => {
    const Component = () => <div>Wrapped Component</div>;
    const Wrapped = withLoadingSkeleton(Component, { getIsLoading: () => false });

    render(
      <MemoryRouter>
        <Wrapped />
      </MemoryRouter>
    );

    expect(screen.getByText('Wrapped Component')).toBeInTheDocument();
  });
});
