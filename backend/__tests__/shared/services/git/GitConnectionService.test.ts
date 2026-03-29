import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { GitRepository } from '@enterpriseglue/shared/db/entities/GitRepository.js';
import { GitAuditLog } from '@enterpriseglue/shared/db/entities/GitAuditLog.js';
import { gitConnectionService } from '@enterpriseglue/shared/services/git/GitConnectionService.js';

vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@enterpriseglue/shared/services/encryption.js', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
}));

vi.mock('@enterpriseglue/shared/utils/id.js', () => ({
  generateId: vi.fn(() => 'generated-id'),
}));

describe('GitConnectionService', () => {
  const mockRepoFindOne = vi.fn();
  const mockRepoInsert = vi.fn();
  const mockRepoUpdate = vi.fn();
  const mockRepoDelete = vi.fn();
  const mockAuditInsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === GitRepository) return {
          findOne: mockRepoFindOne,
          insert: mockRepoInsert,
          update: mockRepoUpdate,
          delete: mockRepoDelete,
        };
        if (entity === GitAuditLog) return {
          insert: mockAuditInsert,
        };
        throw new Error(`Unexpected entity: ${entity}`);
      },
    });
  });

  describe('getProjectConnection', () => {
    it('returns connected: false when no repository exists', async () => {
      mockRepoFindOne.mockResolvedValue(null);

      const result = await gitConnectionService.getProjectConnection('proj-1');

      expect(result).toEqual({ connected: false });
    });

    it('returns connection info when repository exists', async () => {
      mockRepoFindOne.mockResolvedValue({
        providerId: 'p1',
        repositoryName: 'my-repo',
        namespace: 'org',
        defaultBranch: 'main',
        remoteUrl: 'https://github.com/org/my-repo',
        encryptedToken: 'enc:token',
        lastValidatedAt: 1000,
        tokenScopeHint: 'repo',
        connectedByUserId: 'user-1',
        lastSyncAt: 2000,
      });

      const result = await gitConnectionService.getProjectConnection('proj-1');

      expect(result.connected).toBe(true);
      expect(result.repositoryName).toBe('my-repo');
      expect(result.namespace).toBe('org');
      expect(result.hasToken).toBe(true);
      expect(result.lastValidatedAt).toBe(1000);
      expect(result.lastSyncAt).toBe(2000);
    });

    it('returns hasToken: false when no encrypted token', async () => {
      mockRepoFindOne.mockResolvedValue({
        providerId: 'p1',
        repositoryName: 'my-repo',
        namespace: null,
        defaultBranch: 'main',
        remoteUrl: 'https://github.com/my-repo',
        encryptedToken: null,
        lastValidatedAt: null,
        tokenScopeHint: null,
        connectedByUserId: null,
        lastSyncAt: null,
      });

      const result = await gitConnectionService.getProjectConnection('proj-1');

      expect(result.hasToken).toBe(false);
      expect(result.lastValidatedAt).toBeNull();
    });
  });

  describe('connectProject', () => {
    it('creates new connection when none exists', async () => {
      mockRepoFindOne.mockResolvedValue(null);
      mockRepoInsert.mockResolvedValue(undefined);
      mockAuditInsert.mockResolvedValue(undefined);

      const result = await gitConnectionService.connectProject({
        projectId: 'proj-1',
        providerId: 'p1',
        repositoryName: 'my-repo',
        namespace: 'org',
        defaultBranch: 'main',
        token: 'ghp_token123',
        userId: 'user-1',
      });

      expect(result).toEqual({ success: true, repoFullName: 'org/my-repo' });
      expect(mockRepoInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'generated-id',
          projectId: 'proj-1',
          providerId: 'p1',
          repositoryName: 'my-repo',
          namespace: 'org',
          defaultBranch: 'main',
          encryptedToken: 'enc:ghp_token123',
        }),
      );
    });

    it('updates existing connection when one exists', async () => {
      mockRepoFindOne.mockResolvedValue({ id: 'existing-repo-id' });
      mockRepoUpdate.mockResolvedValue({ affected: 1 });
      mockAuditInsert.mockResolvedValue(undefined);

      const result = await gitConnectionService.connectProject({
        projectId: 'proj-1',
        providerId: 'p1',
        repositoryName: 'updated-repo',
        defaultBranch: 'main',
        token: 'ghp_new_token',
        userId: 'user-1',
      });

      expect(result).toEqual({ success: true, repoFullName: 'updated-repo' });
      expect(mockRepoUpdate).toHaveBeenCalledWith(
        { id: 'existing-repo-id' },
        expect.objectContaining({
          repositoryName: 'updated-repo',
          encryptedToken: 'enc:ghp_new_token',
        }),
      );
      expect(mockRepoInsert).not.toHaveBeenCalled();
    });

    it('writes audit log entry', async () => {
      mockRepoFindOne.mockResolvedValue(null);
      mockRepoInsert.mockResolvedValue(undefined);
      mockAuditInsert.mockResolvedValue(undefined);

      await gitConnectionService.connectProject({
        projectId: 'proj-1',
        providerId: 'p1',
        repositoryName: 'my-repo',
        defaultBranch: 'main',
        token: 'tok',
        userId: 'user-1',
      });

      expect(mockAuditInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'create-connection',
          userId: 'user-1',
          status: 'success',
        }),
      );
    });
  });

  describe('updateToken', () => {
    it('updates token on existing connection', async () => {
      mockRepoFindOne.mockResolvedValue({
        id: 'repo-1', repositoryName: 'my-repo', namespace: 'org',
      });
      mockRepoUpdate.mockResolvedValue({ affected: 1 });
      mockAuditInsert.mockResolvedValue(undefined);

      const result = await gitConnectionService.updateToken({
        projectId: 'proj-1',
        token: 'new-token',
        userId: 'user-1',
      });

      expect(result).toEqual({ repoFullName: 'org/my-repo' });
      expect(mockRepoUpdate).toHaveBeenCalledWith(
        { id: 'repo-1' },
        expect.objectContaining({ encryptedToken: 'enc:new-token' }),
      );
    });

    it('throws when no connection exists', async () => {
      mockRepoFindOne.mockResolvedValue(null);

      await expect(gitConnectionService.updateToken({
        projectId: 'proj-1',
        token: 'tok',
        userId: 'user-1',
      })).rejects.toThrow();
    });
  });

  describe('disconnectProject', () => {
    it('deletes repository and logs audit', async () => {
      mockRepoDelete.mockResolvedValue({ affected: 1 });
      mockAuditInsert.mockResolvedValue(undefined);

      await gitConnectionService.disconnectProject('proj-1', 'user-1');

      expect(mockRepoDelete).toHaveBeenCalledWith({ projectId: 'proj-1' });
      expect(mockAuditInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'disconnect',
          userId: 'user-1',
        }),
      );
    });
  });

  describe('getRepoForValidation', () => {
    it('returns repo entity for validation', async () => {
      const repo = { id: 'repo-1', projectId: 'proj-1' };
      mockRepoFindOne.mockResolvedValue(repo);

      const result = await gitConnectionService.getRepoForValidation('proj-1');
      expect(result).toEqual(repo);
    });

    it('returns null when no repo exists', async () => {
      mockRepoFindOne.mockResolvedValue(null);

      const result = await gitConnectionService.getRepoForValidation('proj-1');
      expect(result).toBeNull();
    });
  });
});
