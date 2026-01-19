import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '@src/shared/hooks/useAuth';
import { AuthContext } from '@src/contexts/AuthContext';

describe('useAuth', () => {
  it('throws without provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });

  it('returns context when provider is present', () => {
    const mockContext = {
      user: { id: 'u1', email: 'user@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      refreshSession: () => Promise.resolve(),
    } as any;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockContext}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(mockContext);
    expect(result.current.user?.id).toBe('u1');
    expect(result.current.isAuthenticated).toBe(true);
  });
});
