import { describe, it, expect } from 'vitest';
import MyProfile from '@src/pages/MyProfile';

describe('MyProfile', () => {
  it('exports MyProfile page component', () => {
    expect(MyProfile).toBeDefined();
    expect(typeof MyProfile).toBe('function');
  });
});
