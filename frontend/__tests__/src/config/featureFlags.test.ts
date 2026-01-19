import { describe, it, expect, vi } from 'vitest';
import { defaultFlags, isFlagEnabled, getChildren, loadFeatureFlags } from '@src/config/featureFlags';

const envProxy = new Proxy(import.meta.env as Record<string, any>, {
  get(target, prop: string) {
    return target[prop];
  },
  set(target, prop: string, value: any) {
    target[prop] = value;
    return true;
  },
});

vi.stubGlobal('import.meta', { env: envProxy });

describe('featureFlags', () => {
  it('resolves parent-child enablement', () => {
    const flags = { ...defaultFlags, voyager: false };
    expect(isFlagEnabled(flags, 'starbase')).toBe(false);
  });

  it('detects circular dependencies', () => {
    const flags = { ...defaultFlags };
    const result = isFlagEnabled(flags, 'voyager', new Set(['voyager']));
    expect(result).toBe(false);
  });

  it('loads flags from env overrides', () => {
    envProxy.VITE_FEATURE_STARBASE = 'false';
    const flags = loadFeatureFlags();
    expect(flags.starbase).toBe(false);
  });

  it('returns children for a parent flag', () => {
    const children = getChildren('missionControl');
    expect(children).toContain('missionControl.processes');
  });
});
