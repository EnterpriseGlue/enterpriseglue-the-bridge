import { describe, it, expect } from 'vitest';
import * as decisionsOverview from '../../../../src/features/mission-control/decisions-overview';

describe('decisions-overview index', () => {
  it('exports decisions overview module', () => {
    expect(decisionsOverview).toBeDefined();
  });
});
