import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstanceHeader } from '@src/features/mission-control/process-instance-detail/components/InstanceHeader';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('InstanceHeader', () => {
  it('renders instance metadata and incident banner', () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });

    render(
      <InstanceHeader
        instanceId="inst-1"
        defName="Order Process"
        defKey="order"
        defVersion={3}
        status="ACTIVE"
        startTime={new Date('2024-01-01T00:00:00Z').toISOString()}
        incidentCount={2}
        onSuspend={vi.fn()}
        onResume={vi.fn()}
        onModify={vi.fn()}
        onTerminate={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Order Process')).toBeInTheDocument();
    expect(screen.getByText('inst-1')).toBeInTheDocument();
    expect(screen.getByText('2 incidents occurred in this instance.')).toBeInTheDocument();
    expect(screen.getByText('Retry failed jobs & tasks')).toBeInTheDocument();
  });
});
