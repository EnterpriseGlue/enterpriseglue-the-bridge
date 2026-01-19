import { describe, it, expect } from 'vitest';
import * as enginesModule from '../../../src/modules/engines/index.js';

describe('engines module index', () => {
  it('exports engines routes', () => {
    expect(enginesModule).toHaveProperty('enginesDeploymentsRoute');
    expect(enginesModule).toHaveProperty('engineManagementRoute');
  });
});
