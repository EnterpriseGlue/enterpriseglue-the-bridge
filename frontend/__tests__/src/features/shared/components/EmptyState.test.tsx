import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@src/features/shared/components/EmptyState';

vi.mock('@carbon/react', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@carbon/icons-react', () => ({
  Add: () => <div>AddIcon</div>,
  Search: () => <div>SearchIcon</div>,
  Filter: () => <div>FilterIcon</div>,
  WarningAlt: () => <div>WarningIcon</div>,
}));

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No items" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('renders action button', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );

    const button = screen.getByText('Add Item');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders search variant icon', () => {
    render(<EmptyState title="No results" variant="search" />);
    expect(screen.getByText('SearchIcon')).toBeInTheDocument();
  });

  it('renders filter variant icon', () => {
    render(<EmptyState title="No items" variant="filter" />);
    expect(screen.getByText('FilterIcon')).toBeInTheDocument();
  });

  it('renders error variant icon', () => {
    render(<EmptyState title="Error occurred" variant="error" />);
    expect(screen.getByText('WarningIcon')).toBeInTheDocument();
  });
});
