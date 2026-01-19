import { describe, it, expect } from 'vitest';
import { cn } from '@src/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBeTruthy();
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'conditional', 'always');
    expect(result).toBeTruthy();
  });

  it('handles empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
