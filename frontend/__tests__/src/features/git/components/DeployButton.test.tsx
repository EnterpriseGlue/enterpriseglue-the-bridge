import { describe, it, expect } from 'vitest';
import DeployButton from '@src/features/git/components/DeployButton';

describe('Git DeployButton', () => {
  it('exports DeployButton component', () => {
    expect(DeployButton).toBeDefined();
    expect(typeof DeployButton).toBe('function');
  });
});
