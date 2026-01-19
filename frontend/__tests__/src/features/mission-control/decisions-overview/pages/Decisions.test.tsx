import { describe, it, expect } from 'vitest';
import Decisions from '@src/features/mission-control/decisions-overview/components/Decisions';

describe('Decisions page', () => {
  it('exports Decisions component', () => {
    expect(Decisions).toBeDefined();
    expect(typeof Decisions).toBe('function');
  });
});
