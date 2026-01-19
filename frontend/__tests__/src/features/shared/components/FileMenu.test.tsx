import { describe, it, expect } from 'vitest';
import FileMenu from '@src/features/shared/components/FileMenu';

describe('FileMenu', () => {
  it('exports FileMenu component', () => {
    expect(FileMenu).toBeDefined();
    expect(typeof FileMenu).toBe('function');
  });
});
