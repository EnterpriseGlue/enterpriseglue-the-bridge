import { describe, it, expect, beforeEach } from 'vitest';
import { useEngineSelectorStore } from '@src/stores/engineSelectorStore';

describe('engineSelectorStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useEngineSelectorStore.setState({ selectedEngineId: null });
  });

  it('defaults to all engines', () => {
    expect(useEngineSelectorStore.getState().selectedEngineId).toBeNull();
  });

  it('updates selected engine', () => {
    useEngineSelectorStore.getState().setSelectedEngineId('engine-1');
    expect(useEngineSelectorStore.getState().selectedEngineId).toBe('engine-1');
    useEngineSelectorStore.getState().setSelectedEngineId(null);
    expect(useEngineSelectorStore.getState().selectedEngineId).toBeNull();
  });
});
