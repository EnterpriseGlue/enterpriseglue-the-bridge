import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MissionControlBridge from '@src/features/mission-control/pages/MissionControlBridge';

describe('MissionControlBridge', () => {
  it('renders mission control tiles', () => {
    render(
      <MemoryRouter initialEntries={['/mission-control']}>
        <MissionControlBridge />
      </MemoryRouter>
    );

    expect(screen.getByText('Mission Control')).toBeInTheDocument();
    expect(screen.getByText('Processes')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toBeInTheDocument();
    expect(screen.getByText('Decisions')).toBeInTheDocument();
  });
});
