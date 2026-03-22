import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ElementLinkOverlayContent, type ElementLinkOverlayContentProps } from '@src/features/starbase/hooks/useElementLinkOverlay';

vi.mock('@carbon/react', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Theme: ({ children }: any) => <div>{children}</div>,
  Toggletip: ({ children }: any) => <div>{children}</div>,
  ToggletipButton: ({ children, label, ...props }: any) => (
    <button aria-label={label} {...props}>
      {children}
    </button>
  ),
  ToggletipContent: ({ children }: any) => <div>{children}</div>,
  Toggle: ({ id, labelText, toggled, onToggle }: any) => (
    <label htmlFor={id}>
      {labelText}
      <input
        id={id}
        type="checkbox"
        aria-label={labelText}
        checked={Boolean(toggled)}
        onChange={() => onToggle?.(!toggled)}
      />
    </label>
  ),
}));

vi.mock('@carbon/icons-react', () => ({
  Link: (props: any) => <span data-testid="link-icon" {...props} />,
  Settings: (props: any) => <span data-testid="settings-icon" {...props} />,
  WarningAltFilled: (props: any) => <span data-testid="warning-icon" {...props} />,
}));

describe('ElementLinkOverlayContent', () => {
  let props: ElementLinkOverlayContentProps;

  beforeEach(() => {
    props = {
      status: 'unlinked',
      linkedLabel: null,
      linkTypeLabel: 'process',
      canOpen: false,
      canCreateProcess: true,
      createProcessDisabled: false,
      createActionLabel: 'Create process',
      onTriggerClick: vi.fn(),
      onLink: vi.fn(),
      onOpen: vi.fn(),
      onCreateProcess: vi.fn(),
      onUnlink: vi.fn(),
    };
  });

  it('shows only the config pill when no linked file can be opened', () => {
    render(<ElementLinkOverlayContent {...props} />);

    expect(screen.getByRole('button', { name: 'Configure process link' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open linked process' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create process' })).toBeInTheDocument();
  });

  it('shows the blue link pill only when a linked file can be opened and navigates directly on click', () => {
    props.status = 'linked';
    props.linkedLabel = 'Review Invoice';
    props.canOpen = true;
    props.canSyncName = true;
    props.nameSyncMode = 'manual';
    props.onSyncName = vi.fn();
    props.onSetNameSyncMode = vi.fn();

    render(<ElementLinkOverlayContent {...props} />);

    expect(screen.getByRole('button', { name: 'Open linked process' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure process link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync element name' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Auto-sync element name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlink' })).toBeInTheDocument();
    expect(screen.getByText('Review Invoice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open linked process' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sync element name' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Auto-sync element name' }));

    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(props.onSyncName).toHaveBeenCalledTimes(1);
    expect(props.onSetNameSyncMode).toHaveBeenCalledWith('auto');
    expect(props.onLink).not.toHaveBeenCalled();
  });

  it('stacks the config pill below the link pill for linked message end events only', () => {
    props.status = 'linked';
    props.linkedLabel = 'Notify Customer';
    props.canOpen = true;
    props.isMessageEndEventLink = true;

    const { container } = render(<ElementLinkOverlayContent {...props} />);

    expect(screen.getByRole('button', { name: 'Open linked process' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure process link' })).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle({ flexDirection: 'column', alignItems: 'flex-start' });
  });
});
