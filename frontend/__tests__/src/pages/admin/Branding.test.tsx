import { describe, it, expect } from 'vitest';
import Branding from '@src/pages/admin/Branding';

describe('Branding', () => {
  it('exports Branding admin page component', () => {
    expect(Branding).toBeDefined();
    expect(typeof Branding).toBe('function');
  });
});
