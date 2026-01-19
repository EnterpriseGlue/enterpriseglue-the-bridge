import { describe, it, expect } from 'vitest';
import * as modalsModule from '@src/features/mission-control/processes-overview/components/modals';

describe('processes-overview modals index', () => {
  it('exports process overview modals', () => {
    expect(modalsModule.InstanceDetailsModal).toBeDefined();
    expect(modalsModule.RetryModal).toBeDefined();
    expect(modalsModule.BulkOperationModals).toBeDefined();
  });
});
