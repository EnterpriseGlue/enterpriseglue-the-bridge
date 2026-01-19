import { describe, it, expect } from 'vitest';
import CanvasToolbar from '@src/features/starbase/components/CanvasToolbar';

describe('CanvasToolbar', () => {
  it('exports CanvasToolbar component', () => {
    expect(CanvasToolbar).toBeDefined();
    expect(typeof CanvasToolbar).toBe('function');
  });
});
