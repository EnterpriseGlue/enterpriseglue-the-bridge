import { describe, it, expect } from 'vitest';
import Editor from '@src/features/starbase/pages/Editor';

describe('Editor', () => {
  it('exports Editor page component', () => {
    expect(Editor).toBeDefined();
    expect(typeof Editor).toBe('function');
  });
});
