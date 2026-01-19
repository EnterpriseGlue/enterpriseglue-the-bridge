import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@src/services/auth';
import { apiClient } from '@src/shared/api/client';

vi.mock('@src/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in user', async () => {
    (apiClient.post as any).mockResolvedValue({
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'test@example.com' },
    });

    const result = await authService.login({ email: 'test@example.com', password: 'Pass123!' });
    expect(result.accessToken).toBe('token-1');
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', expect.any(Object), expect.any(Object));
  });

  it('refreshes token', async () => {
    (apiClient.post as any).mockResolvedValue({ accessToken: 'new-token' });

    const result = await authService.refreshToken({ refreshToken: 'refresh-1' });
    expect(result.accessToken).toBe('new-token');
  });

  it('gets current user', async () => {
    (apiClient.get as any).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

    const result = await authService.getMe();
    expect(result.id).toBe('user-1');
  });

  it('lists users', async () => {
    (apiClient.get as any).mockResolvedValue([{ id: 'user-1' }]);

    const result = await authService.listUsers();
    expect(result).toHaveLength(1);
  });

  it('creates user', async () => {
    (apiClient.post as any).mockResolvedValue({ user: { id: 'user-1' } });

    const result = await authService.createUser({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      platformRole: 'user',
    });
    expect(result.user.id).toBe('user-1');
  });

  it('deletes user', async () => {
    (apiClient.delete as any).mockResolvedValue(undefined);

    await authService.deleteUser('user-1');
    expect(apiClient.delete).toHaveBeenCalledWith('/api/users/user-1');
  });
});
