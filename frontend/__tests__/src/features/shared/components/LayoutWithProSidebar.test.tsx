import { describe, it, expect } from 'vitest';
import LayoutWithProSidebar from '@src/features/shared/components/LayoutWithProSidebar';

describe('LayoutWithProSidebar', () => {
  it('exports LayoutWithProSidebar component', () => {
    expect(LayoutWithProSidebar).toBeDefined();
    expect(typeof LayoutWithProSidebar).toBe('function');
  });
});
