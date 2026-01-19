import { describe, it, expect } from 'vitest';
import { EditVariableModal, AddVariableModal, BulkUploadVariablesModal } from '@src/features/mission-control/process-instance-detail/components/VariableModals';

describe('VariableModals', () => {
  it('exports variable modals', () => {
    expect(EditVariableModal).toBeDefined();
    expect(AddVariableModal).toBeDefined();
    expect(BulkUploadVariablesModal).toBeDefined();
  });
});
