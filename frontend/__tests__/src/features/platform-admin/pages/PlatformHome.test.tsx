import { describe, it, expect } from 'vitest';
import PlatformHome from '@src/features/platform-admin/pages/PlatformHome';

describe('PlatformHome', () => {
  it('exports PlatformHome page component', () => {
    expect(PlatformHome).toBeDefined();
    expect(typeof PlatformHome).toBe('function');
  });
});
