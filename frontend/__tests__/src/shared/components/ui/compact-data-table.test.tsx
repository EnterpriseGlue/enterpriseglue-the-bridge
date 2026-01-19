import { describe, it, expect } from 'vitest';
import { CompactDataTable } from '@src/shared/components/ui/compact-data-table';

describe('compact-data-table', () => {
  it('exports CompactDataTable component', () => {
    expect(CompactDataTable).toBeDefined();
    expect(typeof CompactDataTable).toBe('function');
  });
});
