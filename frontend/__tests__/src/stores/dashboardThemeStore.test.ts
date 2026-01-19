import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardThemeStore } from '@src/stores/dashboardThemeStore';

describe('dashboardThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useDashboardThemeStore.setState({ futuristicMode: false });
  });

  it('defaults to non-futuristic mode', () => {
    expect(useDashboardThemeStore.getState().futuristicMode).toBe(false);
  });

  it('updates and toggles mode', () => {
    useDashboardThemeStore.getState().setFuturisticMode(true);
    expect(useDashboardThemeStore.getState().futuristicMode).toBe(true);
    useDashboardThemeStore.getState().toggleFuturisticMode();
    expect(useDashboardThemeStore.getState().futuristicMode).toBe(false);
  });
});
