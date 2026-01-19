import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FeatureFlagsContext } from '@src/contexts/FeatureFlagsContext';
import { useFeatureFlag, useFeatureFlags } from '@src/shared/hooks/useFeatureFlag';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FeatureFlagsContext.Provider
    value={{
      flags: {
        voyager: true,
        starbase: true,
        missionControl: true,
        engines: true,
        'missionControl.processes': true,
        'missionControl.batches': false,
        'missionControl.decisions': true,
        'starbase.projects': true,
        'starbase.files': true,
        notifications: true,
        userMenu: true,
      },
      isLoading: false,
      isEnabled: (key) => key !== 'missionControl.batches',
      toggleFlag: () => {},
      setFlag: () => {},
      resetFlags: () => {},
    }}
  >
    {children}
  </FeatureFlagsContext.Provider>
);

describe('useFeatureFlag', () => {
  it('throws without provider', () => {
    expect(() => renderHook(() => useFeatureFlag('voyager'))).toThrow(
      'useFeatureFlag must be used within FeatureFlagsProvider'
    );
  });

  it('reads flag state from context', () => {
    const { result } = renderHook(() => useFeatureFlag('missionControl.batches'), { wrapper });
    expect(result.current).toBe(false);
  });

  it('returns true for enabled flag', () => {
    const { result } = renderHook(() => useFeatureFlag('missionControl.processes'), { wrapper });
    expect(result.current).toBe(true);
  });

  it('returns true for top-level flags', () => {
    const { result } = renderHook(() => useFeatureFlag('voyager'), { wrapper });
    expect(result.current).toBe(true);
  });
});

describe('useFeatureFlags', () => {
  it('throws without provider', () => {
    expect(() => renderHook(() => useFeatureFlags())).toThrow(
      'useFeatureFlags must be used within FeatureFlagsProvider'
    );
  });

  it('returns full context when inside provider', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.flags.voyager).toBe(true);
    expect(result.current.flags['missionControl.batches']).toBe(false);
    expect(result.current.isEnabled('missionControl.batches')).toBe(false);
  });
});
