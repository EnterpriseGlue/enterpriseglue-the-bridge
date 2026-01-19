import { describe, it, expect } from 'vitest';
import GitConnections from '@src/pages/settings/GitConnections';

describe('GitConnections', () => {
  it('exports GitConnections settings page component', () => {
    expect(GitConnections).toBeDefined();
    expect(typeof GitConnections).toBe('function');
  });
});
