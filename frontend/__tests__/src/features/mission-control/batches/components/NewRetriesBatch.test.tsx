import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewRetriesBatch from '@src/features/mission-control/batches/components/NewRetriesBatch';

vi.mock('@src/features/mission-control/batches/components/BatchOperationForm', () => ({
  default: ({ operationType }: { operationType: string }) => (
    <div data-testid="batch-operation" data-operation={operationType} />
  ),
}));

describe('NewRetriesBatch', () => {
  it('renders BatchOperationForm with retries operation', () => {
    render(<NewRetriesBatch />);
    const node = screen.getByTestId('batch-operation');
    expect(node.getAttribute('data-operation')).toBe('retries');
  });
});
