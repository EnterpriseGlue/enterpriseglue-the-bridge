import { describe, it, expect } from 'vitest';
import OAuthCallback from '@src/features/git/pages/OAuthCallback';

describe('OAuthCallback', () => {
  it('exports OAuthCallback page component', () => {
    expect(OAuthCallback).toBeDefined();
    expect(typeof OAuthCallback).toBe('function');
  });
});
