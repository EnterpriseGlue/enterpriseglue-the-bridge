import { describe, it, expect } from 'vitest';
import { PADDING_FACTOR, MAX_ZOOM, MIN_ZOOM } from '@src/features/shared/components/viewer/viewerConstants';
import { applyZoomWithPadding } from '@src/features/shared/components/viewer/viewerUtils';

describe('viewer index', () => {
  it('exports viewer constants and utils', () => {
    expect(PADDING_FACTOR).toBeDefined();
    expect(MAX_ZOOM).toBeDefined();
    expect(MIN_ZOOM).toBeDefined();
    expect(applyZoomWithPadding).toBeDefined();
    expect(typeof applyZoomWithPadding).toBe('function');
  });
});
