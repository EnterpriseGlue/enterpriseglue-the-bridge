import { describe, it, expect } from 'vitest';
import { ProcessesDataTable } from '@src/features/mission-control/processes-overview/components/ProcessesDataTable';

describe('ProcessesDataTable', () => {
  it('exports ProcessesDataTable component', () => {
    expect(ProcessesDataTable).toBeDefined();
    expect(typeof ProcessesDataTable).toBe('function');
  });
});
