import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewDeleteBatch from '@src/features/mission-control/batches/components/NewDeleteBatch';

vi.mock('@src/features/mission-control/batches/components/BatchOperationForm', () => ({
  default: ({ operationType }: { operationType: string }) => (
    <div data-testid="batch-operation" data-operation={operationType} />
  ),
}));

describe('NewDeleteBatch', () => {
  it('renders BatchOperationForm with delete operation', () => {
    render(<NewDeleteBatch />);
    const node = screen.getByTestId('batch-operation');
    expect(node.getAttribute('data-operation')).toBe('delete');
  });
});
