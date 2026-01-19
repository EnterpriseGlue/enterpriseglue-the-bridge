import { describe, it, expect } from 'vitest';
import * as sharedComponents from '../../../../src/features/shared/components';

describe('shared components index', () => {
  it('exports shared components', () => {
    expect(sharedComponents).toHaveProperty('Breadcrumbs');
    expect(sharedComponents).toHaveProperty('BreadcrumbBar');
    expect(sharedComponents).toHaveProperty('ConfirmDeleteModal');
  });
});
