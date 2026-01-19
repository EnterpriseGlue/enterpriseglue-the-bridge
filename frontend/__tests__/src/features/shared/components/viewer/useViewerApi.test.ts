import { describe, it, expect } from 'vitest';
import { useViewerApi } from '@src/features/shared/components/viewer/useViewerApi';

describe('useViewerApi', () => {
  it('exports a hook function', () => {
    expect(typeof useViewerApi).toBe('function');
  });
});
