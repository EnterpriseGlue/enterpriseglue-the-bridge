import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { gitRepositoryQueryService } from '@enterpriseglue/shared/services/git/GitRepositoryQueryService.js';

vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('GitRepositoryQueryService', () => {
  const mockGetRawMany = vi.fn();
  const mockGetRawOne = vi.fn();
  const mockDelete = vi.fn();

  const mockQb = {
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    getRawMany: mockGetRawMany,
    getRawOne: mockGetRawOne,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: () => ({
        createQueryBuilder: () => mockQb,
        delete: mockDelete,
      }),
    });
  });

  describe('listForUser', () => {
    it('returns repositories accessible by the user', async () => {
      mockGetRawMany.mockResolvedValue([
        { id: 'r1', projectId: 'p1', repositoryName: 'my-repo', projectName: 'My Project' },
      ]);

      const result = await gitRepositoryQueryService.listForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].repositoryName).toBe('my-repo');
    });

    it('returns empty array when user has no repositories', async () => {
      mockGetRawMany.mockResolvedValue([]);

      const result = await gitRepositoryQueryService.listForUser('user-1');
      expect(result).toEqual([]);
    });

    it('passes projectId filter when provided', async () => {
      mockGetRawMany.mockResolvedValue([]);

      await gitRepositoryQueryService.listForUser('user-1', 'proj-1');

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'r.projectId = :projectId',
        { projectId: 'proj-1' },
      );
    });
  });

  describe('getByIdForUser', () => {
    it('returns repository details when found and accessible', async () => {
      mockGetRawOne.mockResolvedValue({
        id: 'r1', projectId: 'p1', repositoryName: 'my-repo',
      });

      const result = await gitRepositoryQueryService.getByIdForUser('r1', 'user-1');
      expect(result.id).toBe('r1');
    });

    it('throws when repository not found or not accessible', async () => {
      mockGetRawOne.mockResolvedValue(null);

      await expect(gitRepositoryQueryService.getByIdForUser('r1', 'user-1'))
        .rejects.toThrow();
    });
  });

  describe('getProjectIdForRepo', () => {
    it('returns projectId when repo found and accessible', async () => {
      mockGetRawOne.mockResolvedValue({ projectId: 'proj-1' });

      const result = await gitRepositoryQueryService.getProjectIdForRepo('r1', 'user-1');
      expect(result).toBe('proj-1');
    });

    it('throws when repo not found or not accessible', async () => {
      mockGetRawOne.mockResolvedValue(null);

      await expect(gitRepositoryQueryService.getProjectIdForRepo('r1', 'user-1'))
        .rejects.toThrow();
    });
  });

  describe('deleteById', () => {
    it('deletes repository by ID', async () => {
      mockDelete.mockResolvedValue({ affected: 1 });

      await gitRepositoryQueryService.deleteById('r1');

      expect(mockDelete).toHaveBeenCalledWith({ id: 'r1' });
    });
  });
});
