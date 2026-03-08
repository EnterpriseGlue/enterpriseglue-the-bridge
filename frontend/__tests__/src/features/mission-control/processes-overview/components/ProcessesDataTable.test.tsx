import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProcessesDataTable } from '../../../../../../../packages/frontend-host/src/features/mission-control/processes-overview/components/ProcessesDataTable';

type ProcessesDataTableData = React.ComponentProps<typeof ProcessesDataTable>['data'];

function renderTable(searchValue: string, data?: ProcessesDataTableData) {
  const onActivate = vi.fn(async () => undefined);
  const onSuspend = vi.fn(async () => undefined);

  render(
    <MemoryRouter>
      <ProcessesDataTable
        data={data || [
          {
            id: 'pi-1',
            processDefinitionKey: 'invoice-receipt',
            superProcessInstanceId: 'parent-123',
            state: 'ACTIVE',
          },
          {
            id: 'pi-2',
            processDefinitionKey: 'order-process',
            superProcessInstanceId: null,
            state: 'ACTIVE',
          },
        ]}
        onTerminate={vi.fn()}
        onRetry={vi.fn()}
        onActivate={onActivate}
        onSuspend={onSuspend}
        selectedMap={{}}
        setSelectedMap={vi.fn() as React.Dispatch<React.SetStateAction<Record<string, boolean>>>}
        retryingMap={{}}
        hoveredRowId={null}
        setHoveredRowId={vi.fn()}
        processNameMap={{
          'invoice-receipt': 'Invoice Receipt',
          'order-process': 'Order Process',
        }}
        searchValue={searchValue}
      />
    </MemoryRouter>
  );
}

describe('ProcessesDataTable', () => {
  it('filters by resolved process name', () => {
    renderTable('recei');

    expect(screen.getByText('Invoice Receipt')).toBeInTheDocument();
    expect(screen.queryByText('Order Process')).not.toBeInTheDocument();
  });

  it('filters by parent instance id', () => {
    renderTable('parent-123');

    expect(screen.getByText('parent-123')).toBeInTheDocument();
    expect(screen.queryByText('Order Process')).not.toBeInTheDocument();
  });

  it('renders duration using the shared execution-trail format', () => {
    renderTable('', [
      {
        id: 'pi-1',
        processDefinitionKey: 'invoice-receipt',
        superProcessInstanceId: 'parent-123',
        state: 'COMPLETED',
        startTime: '2026-03-08T10:00:00.000Z',
        endTime: '2026-03-08T10:01:01.000Z',
      },
    ]);

    expect(screen.getByText('1 min 1 sec')).toBeInTheDocument();
  });
});
