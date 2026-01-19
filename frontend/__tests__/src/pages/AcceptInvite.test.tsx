import { describe, it, expect } from 'vitest';
import AcceptInvite from '@src/pages/AcceptInvite';

describe('AcceptInvite', () => {
  it('exports AcceptInvite page component', () => {
    expect(AcceptInvite).toBeDefined();
    expect(typeof AcceptInvite).toBe('function');
  });
});
