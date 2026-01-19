import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewSuspendBatch from '@src/features/mission-control/batches/components/NewSuspendBatch';

vi.mock('@src/features/mission-control/batches/components/BatchOperationForm', () => ({
  default: ({ operationType }: { operationType: string }) => (
    <div data-testid="batch-operation" data-operation={operationType} />
  ),
}));

describe('NewSuspendBatch', () => {
  it('renders BatchOperationForm with suspend operation', () => {
    render(<NewSuspendBatch />);
    const node = screen.getByTestId('batch-operation');
    expect(node.getAttribute('data-operation')).toBe('suspend');
  });
});
