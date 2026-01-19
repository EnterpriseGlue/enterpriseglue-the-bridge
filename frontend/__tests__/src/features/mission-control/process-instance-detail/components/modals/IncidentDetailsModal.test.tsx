import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentDetailsModal } from '@src/features/mission-control/process-instance-detail/components/modals/IncidentDetailsModal';

vi.mock('@carbon/react', async () => {
  const actual = await vi.importActual<any>('@carbon/react');
  return {
    ...actual,
    Modal: ({ children, modalHeading }: any) => (
      <div>
        <h2>{modalHeading}</h2>
        {children}
      </div>
    ),
  };
});

describe('IncidentDetailsModal', () => {
  it('renders incident details when provided', () => {
    render(
      <IncidentDetailsModal
        incidentDetails={{ activityId: 'task1', incidentType: 'failed', jobId: 'job1' }}
        jobById={new Map([['job1', { retries: 2 }]])}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Incident — task1')).toBeInTheDocument();
    expect(screen.getByText('Flow node:')).toBeInTheDocument();
    expect(screen.getByText('task1')).toBeInTheDocument();
  });
});
