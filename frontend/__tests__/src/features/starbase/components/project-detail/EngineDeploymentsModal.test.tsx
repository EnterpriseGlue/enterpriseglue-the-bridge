import { describe, it, expect } from 'vitest';
import { EngineDeploymentsModal } from '@src/features/starbase/components/project-detail/EngineDeploymentsModal';

describe('EngineDeploymentsModal', () => {
  it('exports EngineDeploymentsModal component', () => {
    expect(EngineDeploymentsModal).toBeDefined();
    expect(typeof EngineDeploymentsModal).toBe('function');
  });
});
