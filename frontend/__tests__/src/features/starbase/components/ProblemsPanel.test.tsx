import { describe, it, expect } from 'vitest';
import ProblemsPanel from '@src/features/starbase/components/ProblemsPanel';

describe('ProblemsPanel', () => {
  it('exports ProblemsPanel component', () => {
    expect(ProblemsPanel).toBeDefined();
    expect(typeof ProblemsPanel).toBe('function');
  });
});
