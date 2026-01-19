import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivityMonitor } from '@src/shared/hooks/useActivityMonitor';

describe('useActivityMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('fires onInactive after timeout', () => {
    vi.useFakeTimers();
    const onInactive = vi.fn();

    renderHook(() => useActivityMonitor({ timeoutMs: 1000, onInactive }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onInactive).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('resets timer on activity', () => {
    const onInactive = vi.fn();

    renderHook(() => useActivityMonitor({ timeoutMs: 1000, onInactive }));

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
      vi.advanceTimersByTime(900);
    });

    expect(onInactive).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onInactive).toHaveBeenCalled();
  });

  it('does not register listeners when disabled', () => {
    const onInactive = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useActivityMonitor({ timeoutMs: 1000, onInactive, enabled: false }));

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onInactive).not.toHaveBeenCalled();
  });

  it('clears timer when disabled after being enabled', () => {
    const onInactive = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => useActivityMonitor({ timeoutMs: 1000, onInactive, enabled }),
      { initialProps: { enabled: true } }
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    rerender({ enabled: false });

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(onInactive).not.toHaveBeenCalled();
  });

  it('debounces activity events within 1 second', () => {
    const onInactive = vi.fn();

    renderHook(() => useActivityMonitor({ timeoutMs: 1000, onInactive }));

    act(() => {
      vi.advanceTimersByTime(200);
      window.dispatchEvent(new Event('mousemove'));
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(800);
    });

    expect(onInactive).toHaveBeenCalledTimes(1);
  });

  it('resets timer when activity occurs after debounce window', () => {
    const onInactive = vi.fn();

    renderHook(() => useActivityMonitor({ timeoutMs: 2000, onInactive }));

    act(() => {
      vi.advanceTimersByTime(1100);
      window.dispatchEvent(new Event('mousemove'));
      vi.advanceTimersByTime(900);
    });

    expect(onInactive).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(onInactive).toHaveBeenCalledTimes(1);
  });

  it('removes listeners on unmount', () => {
    const onInactive = vi.fn();
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useActivityMonitor({ timeoutMs: 1000, onInactive }));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('exposes resetActivityTimer to manually reset timer', () => {
    const onInactive = vi.fn();
    const { result } = renderHook(() => useActivityMonitor({ timeoutMs: 1000, onInactive }));

    act(() => {
      vi.advanceTimersByTime(500);
      result.current.resetActivityTimer();
      vi.advanceTimersByTime(900);
    });

    expect(onInactive).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onInactive).toHaveBeenCalledTimes(1);
  });

  it('does not trigger resetActivityTimer when disabled', () => {
    const onInactive = vi.fn();
    const { result, rerender } = renderHook(
      ({ enabled }) => useActivityMonitor({ timeoutMs: 1000, onInactive, enabled }),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });

    act(() => {
      result.current.resetActivityTimer();
      vi.advanceTimersByTime(1500);
    });

    expect(onInactive).not.toHaveBeenCalled();
  });
});
