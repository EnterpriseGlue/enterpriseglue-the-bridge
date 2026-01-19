import { describe, it, expect } from 'vitest';
import * as hooks from '@src/features/mission-control/processes-overview/hooks';

describe('processes-overview hooks index', () => {
  it('exports processes overview hooks', () => {
    expect(hooks).toHaveProperty('useProcessesData');
    expect(hooks).toHaveProperty('useProcessesModalData');
    expect(hooks).toHaveProperty('useBulkOperations');
    expect(hooks).toHaveProperty('useRetryModal');
  });
});
