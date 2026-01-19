import { describe, it, expect } from 'vitest';
import type { ViewerApi, ElementLinkInfo, ViewerProps, Viewport } from '@src/features/shared/components/viewer/viewerTypes';

describe('viewerTypes', () => {
  it('exports type definitions', () => {
    const api: ViewerApi = {} as ViewerApi;
    const linkInfo: ElementLinkInfo = {} as ElementLinkInfo;
    const props: ViewerProps = {} as ViewerProps;
    const viewport: Viewport = {} as Viewport;
    
    expect(api).toBeDefined();
    expect(linkInfo).toBeDefined();
    expect(props).toBeDefined();
    expect(viewport).toBeDefined();
  });
});
