import { describe, it, expect } from 'vitest';
import { useXMLImport } from '@src/features/shared/components/viewer/useXMLImport';

describe('useXMLImport', () => {
  it('exports useXMLImport hook', () => {
    expect(useXMLImport).toBeDefined();
    expect(typeof useXMLImport).toBe('function');
  });
});
