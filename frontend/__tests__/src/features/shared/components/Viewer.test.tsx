import { describe, it, expect } from 'vitest';
import Viewer from '@src/features/shared/components/Viewer';

describe('Viewer', () => {
  it('exports Viewer component', () => {
    expect(Viewer).toBeDefined();
    expect(typeof Viewer).toBe('function');
  });
});
