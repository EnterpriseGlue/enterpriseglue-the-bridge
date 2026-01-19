import { describe, it, expect } from 'vitest';
import PublishModal from '@src/features/starbase/components/PublishModal';

describe('PublishModal', () => {
  it('exports PublishModal component', () => {
    expect(PublishModal).toBeDefined();
    expect(typeof PublishModal).toBe('function');
  });
});
