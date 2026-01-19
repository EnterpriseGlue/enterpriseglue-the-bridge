import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../src/shared/notifications/ToastProvider';
import Login from '../../../src/pages/Login';

const loginMock = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

vi.mock('@src/shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe('Login error state', () => {
  it('shows error when login fails', async () => {
    const user = userEvent.setup();

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Login />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(Boolean(screen.getByText(/Login failed/i))).toBe(true);
    });
  });
});
