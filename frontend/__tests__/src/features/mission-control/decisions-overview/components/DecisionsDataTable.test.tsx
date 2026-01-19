import { describe, it, expect } from 'vitest';
import { DecisionsDataTable } from '@src/features/mission-control/decisions-overview/components/DecisionsDataTable';

describe('DecisionsDataTable', () => {
  it('exports DecisionsDataTable component', () => {
    expect(DecisionsDataTable).toBeDefined();
    expect(typeof DecisionsDataTable).toBe('function');
  });
});
