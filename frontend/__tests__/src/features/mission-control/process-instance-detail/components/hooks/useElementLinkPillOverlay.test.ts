import { describe, it, expect } from 'vitest';
import { useElementLinkPillOverlay } from '@src/features/mission-control/process-instance-detail/components/hooks/useElementLinkPillOverlay';

describe('useElementLinkPillOverlay', () => {
  it('exports useElementLinkPillOverlay hook', () => {
    expect(useElementLinkPillOverlay).toBeDefined();
    expect(typeof useElementLinkPillOverlay).toBe('function');
  });
});
