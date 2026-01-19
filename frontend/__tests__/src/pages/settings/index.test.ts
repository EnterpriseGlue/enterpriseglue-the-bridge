import { describe, it, expect } from 'vitest';
import * as settingsModule from '@src/pages/settings/index';

describe('settings index', () => {
  it('exports GitConnections page', () => {
    expect(settingsModule.GitConnections).toBeDefined();
  });
});
