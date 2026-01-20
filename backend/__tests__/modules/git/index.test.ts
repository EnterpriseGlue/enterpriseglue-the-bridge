import { describe, it, expect } from 'vitest';
import { gitRoute } from '../../../src/modules/git/index.js';

describe('git module index', () => {
  it('exports git routes', () => {
    expect(gitRoute).toBeDefined();
    expect(typeof gitRoute).toBe('function');
  });
});
