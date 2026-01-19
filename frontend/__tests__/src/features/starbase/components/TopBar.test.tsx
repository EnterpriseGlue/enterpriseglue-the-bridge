import { describe, it, expect } from 'vitest';
import TopBar from '@src/features/starbase/components/TopBar';

describe('TopBar', () => {
  it('exports TopBar component', () => {
    expect(TopBar).toBeDefined();
    expect(typeof TopBar).toBe('function');
  });
});
