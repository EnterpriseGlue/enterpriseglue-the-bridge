import { describe, it, expect } from 'vitest';
import EnginesPage from '@src/features/mission-control/engines/EnginesPage';

describe('EnginesPage', () => {
  it('exports EnginesPage component', () => {
    expect(EnginesPage).toBeDefined();
    expect(typeof EnginesPage).toBe('function');
  });
});
