import { describe, it, expect } from 'vitest';
import DeployDialog from '@src/features/git/components/DeployDialog';

describe('Git DeployDialog', () => {
  it('exports DeployDialog component', () => {
    expect(DeployDialog).toBeDefined();
    expect(typeof DeployDialog).toBe('function');
  });
});
