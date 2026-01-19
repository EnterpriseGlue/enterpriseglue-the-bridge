import { describe, it, expect } from 'vitest';
import Breadcrumbs from '@src/features/shared/components/Breadcrumbs';

describe('Breadcrumbs', () => {
  it('exports Breadcrumbs component', () => {
    expect(Breadcrumbs).toBeDefined();
    expect(typeof Breadcrumbs).toBe('function');
  });
});
