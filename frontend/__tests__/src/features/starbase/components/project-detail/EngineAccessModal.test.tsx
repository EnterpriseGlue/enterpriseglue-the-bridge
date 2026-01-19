import { describe, it, expect } from 'vitest';
import { EngineAccessModal } from '@src/features/starbase/components/project-detail/EngineAccessModal';

describe('EngineAccessModal', () => {
  it('exports EngineAccessModal component', () => {
    expect(EngineAccessModal).toBeDefined();
    expect(typeof EngineAccessModal).toBe('function');
  });
});
