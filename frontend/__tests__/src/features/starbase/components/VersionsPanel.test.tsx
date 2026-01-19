import { describe, it, expect } from 'vitest';
import VersionsPanel from '@src/features/starbase/components/VersionsPanel';

describe('VersionsPanel', () => {
  it('exports VersionsPanel component', () => {
    expect(VersionsPanel).toBeDefined();
    expect(typeof VersionsPanel).toBe('function');
  });
});
