import { describe, it, expect } from 'vitest';
import * as tableModule from '@src/shared/components/ui/table';

describe('table', () => {
  it('exports table module', () => {
    expect(tableModule).toBeDefined();
    expect(typeof tableModule).toBe('object');
  });
});
