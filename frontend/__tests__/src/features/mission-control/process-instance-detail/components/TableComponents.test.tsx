import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalVariablesTable, GlobalVariablesTable } from '@src/features/mission-control/process-instance-detail/components/TableComponents';

describe('TableComponents', () => {
  it('renders empty state for local variables', () => {
    render(<LocalVariablesTable data={[]} />);
    expect(screen.getByText('No variables.')).toBeInTheDocument();
  });

  it('renders empty state for global variables', () => {
    render(<GlobalVariablesTable data={{}} />);
    expect(screen.getByText('No variables.')).toBeInTheDocument();
  });
});
