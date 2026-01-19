import { describe, it, expect } from 'vitest';
import * as adminSchemas from '../../../src/modules/admin/schemas/index.js';

describe('admin schemas index', () => {
  it('loads admin schemas module', () => {
    expect(adminSchemas).toBeDefined();
  });
});
