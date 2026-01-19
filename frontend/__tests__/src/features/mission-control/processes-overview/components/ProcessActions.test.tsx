import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessActions } from '@src/features/mission-control/processes-overview/components/ProcessActions';

describe('ProcessActions', () => {
  it('renders summary text without selection', () => {
    render(
      <ProcessActions
        hasSelection={false}
        selectedCount={0}
        totalCount={10}
        canRetry={false}
        canActivate={false}
        canSuspend={false}
        canDelete={false}
        canMigrate={false}
        onRetry={vi.fn()}
        onActivate={vi.fn()}
        onSuspend={vi.fn()}
        onDelete={vi.fn()}
        onMigrate={vi.fn()}
        onDiscard={vi.fn()}
      />
    );

    expect(screen.getByText('10 Process Instances')).toBeInTheDocument();
  });

  it('invokes handlers when action buttons clicked', () => {
    const onRetry = vi.fn();
    const onActivate = vi.fn();
    const onSuspend = vi.fn();
    const onDelete = vi.fn();
    const onMigrate = vi.fn();
    const onDiscard = vi.fn();

    render(
      <ProcessActions
        hasSelection
        selectedCount={2}
        totalCount={5}
        canRetry
        canActivate
        canSuspend
        canDelete
        canMigrate
        onRetry={onRetry}
        onActivate={onActivate}
        onSuspend={onSuspend}
        onDelete={onDelete}
        onMigrate={onMigrate}
        onDiscard={onDiscard}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /retry failed jobs/i }));
    fireEvent.click(screen.getByRole('button', { name: /activate/i }));
    fireEvent.click(screen.getByRole('button', { name: /suspend/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /migrate/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard selection/i }));

    expect(onRetry).toHaveBeenCalled();
    expect(onActivate).toHaveBeenCalled();
    expect(onSuspend).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
    expect(onMigrate).toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalled();
  });
});
