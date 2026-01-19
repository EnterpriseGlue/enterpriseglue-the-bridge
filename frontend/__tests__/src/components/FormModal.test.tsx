import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormModal from '@src/components/FormModal';

vi.mock('@carbon/react', () => ({
  Modal: ({ open, modalHeading, primaryButtonText, secondaryButtonText, onRequestSubmit, onRequestClose, children }: any) => {
    if (!open) return null;
    return (
      <div data-testid="modal">
        <h2>{modalHeading}</h2>
        <div>{children}</div>
        <button onClick={onRequestSubmit}>{primaryButtonText}</button>
        <button onClick={onRequestClose}>{secondaryButtonText}</button>
      </div>
    );
  },
}));

describe('FormModal', () => {
  it('renders modal when open', () => {
    render(
      <FormModal
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        title="Test Modal"
      >
        <div>Content</div>
      </FormModal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <FormModal
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        title="Test Modal"
      >
        <div>Content</div>
      </FormModal>
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('calls onSubmit when submit button clicked', () => {
    const onSubmit = vi.fn();
    render(
      <FormModal
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        title="Test Modal"
        submitText="Save"
      >
        <div>Content</div>
      </FormModal>
    );

    fireEvent.click(screen.getByText('Save'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn();
    render(
      <FormModal
        open={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        title="Test Modal"
        cancelText="Cancel"
      >
        <div>Content</div>
      </FormModal>
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows processing text when busy', () => {
    render(
      <FormModal
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        title="Test Modal"
        busy={true}
      >
        <div>Content</div>
      </FormModal>
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
