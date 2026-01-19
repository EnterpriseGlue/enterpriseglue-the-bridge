import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDeleteModal from '@src/features/shared/components/ConfirmDeleteModal';

vi.mock('@src/shared/components/ConfirmModal', () => ({
  default: ({ open, title, description, confirmText, onClose, onConfirm }: any) => 
    open ? (
      <div data-testid="confirm-modal">
        <h2>{title}</h2>
        <p>{description}</p>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null,
}));

describe('ConfirmDeleteModal', () => {
  it('renders modal when open', () => {
    render(
      <ConfirmDeleteModal
        open={true}
        title="Delete Item"
        description="Are you sure?"
        dangerLabel="Delete"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ConfirmDeleteModal
        open={false}
        title="Delete Item"
        description="Are you sure?"
        dangerLabel="Delete"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDeleteModal
        open={true}
        title="Delete Item"
        description="Are you sure?"
        dangerLabel="Delete"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDeleteModal
        open={true}
        title="Delete Item"
        description="Are you sure?"
        dangerLabel="Delete"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
