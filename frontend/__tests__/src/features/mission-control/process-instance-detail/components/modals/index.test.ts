import { describe, it, expect } from 'vitest';
import * as modalsModule from '@src/features/mission-control/process-instance-detail/components/modals';

describe('process instance modals index', () => {
  it('exports instance detail modals', () => {
    expect(modalsModule.IncidentDetailsModal).toBeDefined();
    expect(modalsModule.ModificationIntroModal).toBeDefined();
    expect(modalsModule.DiscardConfirmModal).toBeDefined();
    expect(modalsModule.TerminateConfirmModal).toBeDefined();
    expect(modalsModule.RetryModal).toBeDefined();
  });
});
