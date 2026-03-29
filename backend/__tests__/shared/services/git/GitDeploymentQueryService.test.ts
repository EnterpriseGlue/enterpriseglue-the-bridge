import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { GitDeployment } from '@enterpriseglue/shared/db/entities/GitDeployment.js';
import { EnvironmentTag } from '@enterpriseglue/shared/db/entities/EnvironmentTag.js';
import { gitDeploymentQueryService } from '@enterpriseglue/shared/services/git/GitDeploymentQueryService.js';

vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('GitDeploymentQueryService', () => {
  const mockDeploymentFind = vi.fn();
  const mockDeploymentFindOneBy = vi.fn();
  const mockEnvTagFindOneBy = vi.fn();
  const mockEnvTagFind = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === GitDeployment) return {
          find: mockDeploymentFind,
          findOneBy: mockDeploymentFindOneBy,
        };
        if (entity === EnvironmentTag) return {
          findOneBy: mockEnvTagFindOneBy,
          find: mockEnvTagFind,
        };
        throw new Error(`Unexpected entity: ${entity}`);
      },
    });
  });

  describe('listForProject', () => {
    it('returns deployments ordered by most recent', async () => {
      mockDeploymentFind.mockResolvedValue([
        { id: 'd1', projectId: 'proj-1', deployedAt: 2000 },
        { id: 'd2', projectId: 'proj-1', deployedAt: 1000 },
      ]);

      const result = await gitDeploymentQueryService.listForProject('proj-1');

      expect(result).toHaveLength(2);
      expect(mockDeploymentFind).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        order: { deployedAt: 'DESC' },
        take: 50,
      });
    });

    it('respects custom limit', async () => {
      mockDeploymentFind.mockResolvedValue([]);

      await gitDeploymentQueryService.listForProject('proj-1', 10);

      expect(mockDeploymentFind).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('returns empty array when no deployments', async () => {
      mockDeploymentFind.mockResolvedValue([]);
      const result = await gitDeploymentQueryService.listForProject('proj-1');
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns deployment when found', async () => {
      mockDeploymentFindOneBy.mockResolvedValue({
        id: 'd1', projectId: 'proj-1', commitSha: 'abc123',
      });

      const result = await gitDeploymentQueryService.getById('d1');
      expect(result.commitSha).toBe('abc123');
    });

    it('throws when deployment not found', async () => {
      mockDeploymentFindOneBy.mockResolvedValue(null);

      await expect(gitDeploymentQueryService.getById('nonexistent'))
        .rejects.toThrow();
    });
  });

  describe('isManualDeployAllowed', () => {
    it('returns allowed when environment tag not found', async () => {
      mockEnvTagFindOneBy.mockResolvedValue(null);
      mockEnvTagFind.mockResolvedValue([]);

      const result = await gitDeploymentQueryService.isManualDeployAllowed('staging');
      expect(result).toEqual({ allowed: true });
    });

    it('returns allowed when tag permits manual deploy', async () => {
      mockEnvTagFindOneBy.mockResolvedValue({
        id: 'env-1', name: 'staging', manualDeployAllowed: true,
      });

      const result = await gitDeploymentQueryService.isManualDeployAllowed('env-1');
      expect(result).toEqual({ allowed: true });
    });

    it('returns not allowed when tag blocks manual deploy', async () => {
      mockEnvTagFindOneBy.mockResolvedValue({
        id: 'env-1', name: 'production', manualDeployAllowed: false,
      });

      const result = await gitDeploymentQueryService.isManualDeployAllowed('env-1');
      expect(result).toEqual({ allowed: false, envName: 'production' });
    });

    it('falls back to name match when ID lookup fails', async () => {
      mockEnvTagFindOneBy.mockResolvedValue(null);
      mockEnvTagFind.mockResolvedValue([
        { id: 'env-1', name: 'Production', manualDeployAllowed: false },
      ]);

      const result = await gitDeploymentQueryService.isManualDeployAllowed('production');
      expect(result).toEqual({ allowed: false, envName: 'Production' });
    });
  });
});
