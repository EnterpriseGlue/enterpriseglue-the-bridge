import { describe, it, expect, vi } from 'vitest';
import { filesApi } from '@src/api/starbase/files';
import { apiClient } from '@src/shared/api/client';

vi.mock('@src/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('filesApi', () => {
  it('lists files by project', async () => {
    (apiClient.get as any).mockResolvedValue([{ id: 'f1', name: 'file.bpmn' }]);
    await filesApi.listByProject('p1');
    expect(apiClient.get).toHaveBeenCalledWith('/starbase-api/projects/p1/files');
  });

  it('gets file by id', async () => {
    (apiClient.get as any).mockResolvedValue({ id: 'f1', name: 'file.bpmn' });
    await filesApi.getById('f1');
    expect(apiClient.get).toHaveBeenCalledWith('/starbase-api/files/f1');
  });

  it('creates file', async () => {
    (apiClient.post as any).mockResolvedValue({ id: 'f1', name: 'new.bpmn', type: 'bpmn' });
    await filesApi.create('p1', { name: 'new.bpmn', type: 'bpmn' });
    expect(apiClient.post).toHaveBeenCalledWith('/starbase-api/projects/p1/files', { name: 'new.bpmn', type: 'bpmn' });
  });

  it('updates file XML', async () => {
    (apiClient.put as any).mockResolvedValue({ id: 'f1' });
    await filesApi.updateXml('f1', '<xml>content</xml>', 12345);
    expect(apiClient.put).toHaveBeenCalledWith('/starbase-api/files/f1', { xml: '<xml>content</xml>', prevUpdatedAt: 12345 });
  });

  it('renames file', async () => {
    (apiClient.patch as any).mockResolvedValue({ id: 'f1', name: 'renamed.bpmn' });
    await filesApi.rename('f1', 'renamed.bpmn');
    expect(apiClient.patch).toHaveBeenCalledWith('/starbase-api/files/f1', { name: 'renamed.bpmn' });
  });

  it('deletes file', async () => {
    (apiClient.delete as any).mockResolvedValue({});
    await filesApi.delete('f1');
    expect(apiClient.delete).toHaveBeenCalledWith('/starbase-api/files/f1');
  });
});
