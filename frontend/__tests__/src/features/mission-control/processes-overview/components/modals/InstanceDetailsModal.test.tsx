import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstanceDetailsModal } from '@src/features/mission-control/processes-overview/components/modals/InstanceDetailsModal';

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

describe('InstanceDetailsModal', () => {
  it('renders empty history and variables messages', () => {
    render(
      <InstanceDetailsModal
        open={true}
        instanceId="inst-1"
        onClose={vi.fn()}
        histQLoading={false}
        histQData={[]}
        varsQLoading={false}
        varsQData={{}}
      />
    );

    expect(screen.getByText('Instance inst-1')).toBeInTheDocument();
    expect(screen.getByText('No activity history.')).toBeInTheDocument();
    expect(screen.getByText('No variables.')).toBeInTheDocument();
  });
});
