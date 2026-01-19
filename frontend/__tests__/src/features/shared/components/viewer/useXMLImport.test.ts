import { describe, it, expect } from 'vitest';
import { useXMLImport } from '@src/features/shared/components/viewer/useXMLImport';

describe('useXMLImport', () => {
  it('exports a hook function', () => {
    expect(typeof useXMLImport).toBe('function');
  });
});
