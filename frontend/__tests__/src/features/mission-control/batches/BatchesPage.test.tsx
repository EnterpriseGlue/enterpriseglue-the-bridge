import { describe, it, expect } from 'vitest';
import BatchesPage from '@src/features/mission-control/batches/BatchesPage';

describe('BatchesPage', () => {
  it('exports a component', () => {
    expect(typeof BatchesPage).toBe('function');
  });
});
