import { describe, it, expect } from 'vitest';
import * as modalsModule from '@src/shared/components/modals/index';

describe('shared modals index', () => {
  it('exports modal components and hooks', () => {
    expect(modalsModule.AlertModal).toBeDefined();
    expect(modalsModule.ConfirmModal).toBeDefined();
    expect(modalsModule.FormModal).toBeDefined();
    expect(modalsModule.useAlert).toBeDefined();
    expect(modalsModule.useModal).toBeDefined();
  });
});
