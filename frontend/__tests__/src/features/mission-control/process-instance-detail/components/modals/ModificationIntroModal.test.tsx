import { describe, it, expect } from 'vitest';
import { ModificationIntroModal } from '@src/features/mission-control/process-instance-detail/components/modals/ModificationIntroModal';

describe('ModificationIntroModal', () => {
  it('exports ModificationIntroModal component', () => {
    expect(ModificationIntroModal).toBeDefined();
    expect(typeof ModificationIntroModal).toBe('function');
  });
});
