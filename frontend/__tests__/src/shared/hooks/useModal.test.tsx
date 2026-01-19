import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from '@src/shared/hooks/useModal';

describe('useModal', () => {
  it('opens and closes modal with data', () => {
    const { result } = renderHook(() => useModal<{ id: string }>());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openModal({ id: '1' });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual({ id: '1' });

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
