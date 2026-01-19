import { describe, it, expect } from 'vitest';
import DMNCanvas from '@src/features/starbase/components/DMNCanvas';

describe('DMNCanvas', () => {
  it('exports DMNCanvas component', () => {
    expect(DMNCanvas).toBeDefined();
    expect(typeof DMNCanvas).toBe('function');
  });
});
