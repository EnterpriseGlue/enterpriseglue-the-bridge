import { describe, it, expect } from 'vitest';
import { CreateOnlineProjectExistingConnectionPanel } from '@src/features/git/components/CreateOnlineProjectExistingConnectionPanel';

describe('CreateOnlineProjectExistingConnectionPanel', () => {
  it('exports CreateOnlineProjectExistingConnectionPanel component', () => {
    expect(CreateOnlineProjectExistingConnectionPanel).toBeDefined();
    expect(typeof CreateOnlineProjectExistingConnectionPanel).toBe('function');
  });
});
