import { describe, it, expect } from 'vitest';
import versioningRouter from '../../../src/modules/versioning/index.js';

describe('versioning module index', () => {
  it('loads versioning router', () => {
    expect(versioningRouter).toBeDefined();
  });
});
