import { describe, it, expect } from 'vitest';
import * as authSchemas from '../../../src/modules/auth/schemas/index.js';

describe('auth schemas index', () => {
  it('loads auth schemas module', () => {
    expect(authSchemas).toBeDefined();
  });
});
