import { describe, it, expect } from 'vitest';
import { useElementLinkOverlay } from '@src/features/starbase/hooks/useElementLinkOverlay';

describe('useElementLinkOverlay', () => {
  it('exports useElementLinkOverlay hook', () => {
    expect(useElementLinkOverlay).toBeDefined();
    expect(typeof useElementLinkOverlay).toBe('function');
  });
});
