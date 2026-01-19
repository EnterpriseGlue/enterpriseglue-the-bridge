import { describe, it, expect } from 'vitest';
import { ToastProvider } from '@src/shared/notifications/ToastProvider';

describe('ToastProvider', () => {
  it('exports ToastProvider component', () => {
    expect(ToastProvider).toBeDefined();
    expect(typeof ToastProvider).toBe('function');
  });
});
