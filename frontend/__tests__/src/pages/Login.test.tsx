import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../src/shared/notifications/ToastProvider';
import Login from '../../../src/pages/Login';

const loginMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@src/shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe('Login', () => {
  it('submits credentials when form is filled', async () => {
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

    const submit = screen.getByRole('button', { name: /sign in/i });
    expect(submit.hasAttribute('disabled')).toBe(true);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');

    expect(submit.hasAttribute('disabled')).toBe(false);

    await user.click(submit);

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
    });
  });
});
