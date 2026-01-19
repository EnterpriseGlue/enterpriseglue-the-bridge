import { describe, it, expect } from 'vitest';
import { useOnlineProjectWizard } from '@src/features/git/hooks/useOnlineProjectWizard';

describe('useOnlineProjectWizard', () => {
  it('exports useOnlineProjectWizard hook', () => {
    expect(useOnlineProjectWizard).toBeDefined();
    expect(typeof useOnlineProjectWizard).toBe('function');
  });
});
