import { describe, it, expect } from 'vitest';
import * as gitPages from '../../../../src/features/git/pages/index.ts';

describe('git pages index', () => {
  it('exports OAuthCallback', () => {
    expect(gitPages).toHaveProperty('OAuthCallback');
  });
});
