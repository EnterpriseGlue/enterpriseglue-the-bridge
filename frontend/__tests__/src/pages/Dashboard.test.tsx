import { describe, it, expect } from 'vitest';
import Dashboard from '@src/pages/Dashboard';

describe('Dashboard', () => {
  it('exports Dashboard page component', () => {
    expect(Dashboard).toBeDefined();
    expect(typeof Dashboard).toBe('function');
  });
});
