import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstanceInfoBar } from '@src/features/mission-control/process-instance-detail/components/InstanceInfoBar';

describe('InstanceInfoBar', () => {
  it('renders instance info when no history context', () => {
    render(
      <InstanceInfoBar
        historyContext={null}
        defName="Order Process"
        instanceId="inst-1"
        defs={[{ key: 'order', version: 2 }]}
        defKey="order"
        histData={{ startTime: new Date('2024-01-01T00:00:00Z').toISOString() }}
        parentId={null}
        status="ACTIVE"
        showModifyAction={true}
        fmt={(ts) => String(ts || '')}
        onNavigate={vi.fn()}
        onCopy={vi.fn()}
        onSuspend={vi.fn()}
        onResume={vi.fn()}
        onModify={vi.fn()}
        onTerminate={vi.fn()}
      />
    );

    expect(screen.getByText('Order Process')).toBeInTheDocument();
    expect(screen.getByText('inst-1')).toBeInTheDocument();
    expect(screen.getByText('ver.')).toBeInTheDocument();
  });
});
