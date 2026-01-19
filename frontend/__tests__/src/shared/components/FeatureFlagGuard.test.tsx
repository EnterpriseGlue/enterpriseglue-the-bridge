import { describe, it, expect } from 'vitest';
import { FeatureFlagGuard } from '@src/shared/components/FeatureFlagGuard';

describe('FeatureFlagGuard', () => {
  it('exports FeatureFlagGuard component', () => {
    expect(FeatureFlagGuard).toBeDefined();
    expect(typeof FeatureFlagGuard).toBe('function');
  });
});
