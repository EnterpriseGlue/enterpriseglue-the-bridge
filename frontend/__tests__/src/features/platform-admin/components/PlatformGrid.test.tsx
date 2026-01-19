import { describe, it, expect } from 'vitest';
import { PlatformGrid } from '@src/features/platform-admin/components/PlatformGrid';

describe('PlatformGrid', () => {
  it('exports PlatformGrid component', () => {
    expect(PlatformGrid).toBeDefined();
    expect(typeof PlatformGrid).toBe('function');
  });
});
