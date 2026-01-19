import { describe, it, expect } from 'vitest';
import * as gitModule from '../../../src/modules/git/index.js';

describe('git module index', () => {
  it('exports git routes', () => {
    expect(gitModule).toHaveProperty('gitRouter');
  });
});
