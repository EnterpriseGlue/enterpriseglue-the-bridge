import { describe, it, expect } from 'vitest';
import BatchDetailModal from '@src/features/mission-control/batches/components/BatchDetailModal';

describe('BatchDetailModal', () => {
  it('exports BatchDetailModal component', () => {
    expect(BatchDetailModal).toBeDefined();
    expect(typeof BatchDetailModal).toBe('function');
  });
});
