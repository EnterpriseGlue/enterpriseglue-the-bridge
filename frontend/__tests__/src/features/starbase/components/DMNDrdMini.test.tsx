import { describe, it, expect, vi } from 'vitest';

// Mock camunda-dmn-js: the upstream dmn-js packages have broken ESM exports
// (missing .js extensions) which Node's ESM resolver rejects before Vitest
// can intercept. Same root cause as the DMNCanvas.test.tsx exclusion.
vi.mock('camunda-dmn-js', () => ({
  CamundaPlatformModeler: vi.fn().mockImplementation(() => ({
    importXML: vi.fn().mockResolvedValue({}),
    getViews: vi.fn().mockReturnValue([]),
    open: vi.fn().mockResolvedValue(undefined),
    getActiveViewer: vi.fn().mockReturnValue({ get: vi.fn() }),
    getActiveView: vi.fn().mockReturnValue(null),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  })),
}));
vi.mock('camunda-dmn-js/dist/assets/camunda-platform-modeler.css', () => ({}));

import DMNDrdMini from '@src/features/starbase/components/DMNDrdMini';

describe('DMNDrdMini', () => {
  it('exports DMNDrdMini component', () => {
    expect(DMNDrdMini).toBeDefined();
    expect(typeof DMNDrdMini).toBe('function');
  });
});
