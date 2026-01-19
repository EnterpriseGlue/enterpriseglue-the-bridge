import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessInstanceDiagramPane } from '@src/features/mission-control/process-instance-detail/components/ProcessInstanceDiagramPane';

vi.mock('@src/features/shared/components/Viewer', () => ({
  default: () => <div>Viewer</div>,
}));

describe('ProcessInstanceDiagramPane', () => {
  it('renders viewer when xml is provided', async () => {
    render(
      <ProcessInstanceDiagramPane
        instanceId="pi1"
        xml="<bpmn />"
        onReady={vi.fn()}
        onDiagramReset={vi.fn()}
        onElementNavigate={vi.fn()}
      />
    );

    expect(await screen.findByText('Viewer')).toBeInTheDocument();
  });
});
