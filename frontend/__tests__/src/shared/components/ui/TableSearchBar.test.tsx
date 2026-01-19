import { describe, it, expect } from 'vitest';
import { TableSearchBar } from '@src/shared/components/ui/TableSearchBar';

describe('TableSearchBar', () => {
  it('exports TableSearchBar component', () => {
    expect(TableSearchBar).toBeDefined();
    expect(typeof TableSearchBar).toBe('function');
  });
});
