import { describe, it, expect } from 'vitest';
import { useDiagramOverlays } from '@src/features/mission-control/process-instance-detail/components/hooks/useDiagramOverlays';

describe('useDiagramOverlays', () => {
  it('exports useDiagramOverlays hook', () => {
    expect(useDiagramOverlays).toBeDefined();
    expect(typeof useDiagramOverlays).toBe('function');
  });
});
