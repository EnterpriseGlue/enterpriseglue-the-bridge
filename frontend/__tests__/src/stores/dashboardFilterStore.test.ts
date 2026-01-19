import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardFilterStore } from '@src/stores/dashboardFilterStore';

describe('dashboardFilterStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useDashboardFilterStore.setState({ timePeriod: 7 });
  });

  it('uses default time period', () => {
    expect(useDashboardFilterStore.getState().timePeriod).toBe(7);
  });

  it('updates time period', () => {
    useDashboardFilterStore.getState().setTimePeriod(30);
    expect(useDashboardFilterStore.getState().timePeriod).toBe(30);
  });
});
