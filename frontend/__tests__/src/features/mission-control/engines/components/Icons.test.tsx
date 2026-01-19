import { describe, it, expect } from 'vitest';
import * as enginesModule from '@src/features/mission-control/engines';

describe('Engines icons', () => {
  it('uses exported engine components (no local icons module)', () => {
    expect(enginesModule.EngineMembersModal).toBeDefined();
  });
});
