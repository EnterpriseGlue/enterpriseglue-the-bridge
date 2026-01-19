import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAlert } from '@src/shared/hooks/useAlert';

describe('useAlert', () => {
  it('shows and closes alerts', () => {
    const { result } = renderHook(() => useAlert());

    act(() => {
      result.current.showAlert('Message', 'error', 'Title');
    });

    expect(result.current.alertState.open).toBe(true);
    expect(result.current.alertState.message).toBe('Message');
    expect(result.current.alertState.kind).toBe('error');
    expect(result.current.alertState.title).toBe('Title');

    act(() => {
      result.current.closeAlert();
    });

    expect(result.current.alertState.open).toBe(false);
  });
});
