import { describe, it, expect, vi } from 'vitest';
import { projectsApi } from '@src/api/starbase/projects';
import { apiClient } from '@src/shared/api/client';

vi.mock('@src/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('projectsApi', () => {
  it('lists projects', async () => {
    (apiClient.get as any).mockResolvedValue([{ id: 'p1', name: 'Project 1' }]);
    const result = await projectsApi.list();
    expect(apiClient.get).toHaveBeenCalledWith('/starbase-api/projects');
    expect(result).toHaveLength(1);
  });

  it('gets project by id', async () => {
    (apiClient.get as any).mockResolvedValue({ id: 'p1', name: 'Project 1' });
    await projectsApi.getById('p1');
    expect(apiClient.get).toHaveBeenCalledWith('/starbase-api/projects/p1');
  });

  it('creates project', async () => {
    (apiClient.post as any).mockResolvedValue({ id: 'p1', name: 'New Project' });
    await projectsApi.create({ name: 'New Project' });
    expect(apiClient.post).toHaveBeenCalledWith('/starbase-api/projects', { name: 'New Project' });
  });

  it('renames project', async () => {
    (apiClient.patch as any).mockResolvedValue({ id: 'p1', name: 'Renamed' });
    await projectsApi.rename('p1', 'Renamed');
    expect(apiClient.patch).toHaveBeenCalledWith('/starbase-api/projects/p1', { name: 'Renamed' });
  });

  it('deletes project', async () => {
    (apiClient.delete as any).mockResolvedValue({});
    await projectsApi.delete('p1');
    expect(apiClient.delete).toHaveBeenCalledWith('/starbase-api/projects/p1');
  });
});
