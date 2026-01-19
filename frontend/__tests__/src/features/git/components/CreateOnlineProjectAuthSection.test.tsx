import { describe, it, expect } from 'vitest';
import { CreateOnlineProjectAuthSection } from '@src/features/git/components/CreateOnlineProjectAuthSection';

describe('CreateOnlineProjectAuthSection', () => {
  it('exports CreateOnlineProjectAuthSection component', () => {
    expect(CreateOnlineProjectAuthSection).toBeDefined();
    expect(typeof CreateOnlineProjectAuthSection).toBe('function');
  });
});
