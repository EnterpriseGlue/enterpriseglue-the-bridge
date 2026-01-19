import { describe, it, expect } from 'vitest';
import CreateOnlineProjectModal from '@src/features/git/components/CreateOnlineProjectModal';

describe('CreateOnlineProjectModal', () => {
  it('exports CreateOnlineProjectModal component', () => {
    expect(CreateOnlineProjectModal).toBeDefined();
    expect(typeof CreateOnlineProjectModal).toBe('function');
  });
});
