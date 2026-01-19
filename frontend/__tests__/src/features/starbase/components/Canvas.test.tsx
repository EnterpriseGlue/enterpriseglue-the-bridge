import { describe, it, expect } from 'vitest';
import Canvas from '@src/features/starbase/components/Canvas';

describe('Canvas', () => {
  it('exports Canvas component', () => {
    expect(Canvas).toBeDefined();
    expect(typeof Canvas).toBe('function');
  });
});
