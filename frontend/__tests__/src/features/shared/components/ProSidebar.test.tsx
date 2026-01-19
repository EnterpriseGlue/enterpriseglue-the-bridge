import { describe, it, expect } from 'vitest';
import ProSidebar from '@src/features/shared/components/ProSidebar';

describe('ProSidebar', () => {
  it('exports ProSidebar component', () => {
    expect(ProSidebar).toBeDefined();
    expect(typeof ProSidebar).toBe('function');
  });
});
