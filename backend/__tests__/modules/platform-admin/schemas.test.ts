import { describe, it, expect } from 'vitest';
import * as platformAdminSchemas from '../../../src/modules/platform-admin/schemas/index.js';

describe('platform-admin schemas index', () => {
  it('loads platform-admin schemas module', () => {
    expect(platformAdminSchemas).toBeDefined();
  });
});
