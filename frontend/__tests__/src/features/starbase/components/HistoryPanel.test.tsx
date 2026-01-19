import { describe, it, expect } from 'vitest';
import HistoryPanel from '@src/features/starbase/components/HistoryPanel';

describe('HistoryPanel', () => {
  it('exports HistoryPanel component', () => {
    expect(HistoryPanel).toBeDefined();
    expect(typeof HistoryPanel).toBe('function');
  });
});
