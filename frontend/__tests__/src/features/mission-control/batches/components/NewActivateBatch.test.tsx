import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewActivateBatch from '@src/features/mission-control/batches/components/NewActivateBatch';

vi.mock('@src/features/mission-control/batches/components/BatchOperationForm', () => ({
  default: ({ operationType }: { operationType: string }) => (
    <div data-testid="batch-operation" data-operation={operationType} />
  ),
}));

describe('NewActivateBatch', () => {
  it('renders BatchOperationForm with activate operation', () => {
    render(<NewActivateBatch />);
    const node = screen.getByTestId('batch-operation');
    expect(node.getAttribute('data-operation')).toBe('activate');
  });
});
