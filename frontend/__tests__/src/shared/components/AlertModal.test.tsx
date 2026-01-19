import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertModal from '@src/shared/components/AlertModal';

vi.mock('@carbon/react', () => ({
  Modal: ({ open, modalHeading, onRequestSubmit, children }: any) =>
    open ? (
      <div>
        <h2>{modalHeading}</h2>
        <div>{children}</div>
        <button onClick={onRequestSubmit}>OK</button>
      </div>
    ) : null,
}));

describe('AlertModal', () => {
  it('renders message and title', () => {
    const onClose = vi.fn();
    render(
      <AlertModal open={true} title="Warning" message="Message" onClose={onClose} />
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('calls onClose when confirmed', () => {
    const onClose = vi.fn();
    render(
      <AlertModal open={true} title="Info" message="Message" onClose={onClose} />
    );
    fireEvent.click(screen.getByText('OK'));
    expect(onClose).toHaveBeenCalled();
  });
});
