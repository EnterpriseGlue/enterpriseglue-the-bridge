import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FeatureFlagsProvider } from '@src/contexts/FeatureFlagsContext';
import { useFeatureFlags } from '@src/shared/hooks/useFeatureFlag';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
);

describe('FeatureFlagsProvider', () => {
  it('toggles parent flags and disables children', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    act(() => {
      result.current.setFlag('voyager', false);
    });

    expect(result.current.flags.voyager).toBe(false);
    expect(result.current.flags.starbase).toBe(false);
    expect(result.current.flags.missionControl).toBe(false);
  });

  it('resets flags', () => {
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    act(() => {
      result.current.setFlag('notifications', false);
    });

    act(() => {
      result.current.resetFlags();
    });

    expect(result.current.flags.notifications).toBe(true);
  });
});
