import { describe, it, expect } from 'vitest';
import { useViewerApi } from '@src/features/shared/components/viewer/useViewerApi';

describe('useViewerApi', () => {
  it('exports useViewerApi hook', () => {
    expect(useViewerApi).toBeDefined();
    expect(typeof useViewerApi).toBe('function');
  });
});
