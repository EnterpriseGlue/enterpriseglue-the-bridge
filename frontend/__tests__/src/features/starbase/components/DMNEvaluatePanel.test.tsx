import { describe, it, expect } from 'vitest';
import DMNEvaluatePanel from '@src/features/starbase/components/DMNEvaluatePanel';

describe('DMNEvaluatePanel', () => {
  it('exports DMNEvaluatePanel component', () => {
    expect(DMNEvaluatePanel).toBeDefined();
    expect(typeof DMNEvaluatePanel).toBe('function');
  });
});
