import { describe, it, expect } from 'vitest';
import * as enginesModule from '@src/features/mission-control/engines/index';

describe('engines index', () => {
  it('exports engines page and components', () => {
    expect(enginesModule.EnginesPage).toBeDefined();
    expect(enginesModule.EngineMembersModal).toBeDefined();
  });
});
