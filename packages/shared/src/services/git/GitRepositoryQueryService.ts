import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { GitRepository } from '@enterpriseglue/shared/db/entities/GitRepository.js';
import { Project } from '@enterpriseglue/shared/db/entities/Project.js';
import { ProjectMember } from '@enterpriseglue/shared/db/entities/ProjectMember.js';
import { Errors } from '@enterpriseglue/shared/middleware/errorHandler.js';

class GitRepositoryQueryServiceImpl {
  /**
   * List repositories accessible by a user, optionally filtered by projectId
   */
  async listForUser(userId: string, projectId?: string) {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const qb = gitRepoRepo.createQueryBuilder('r')
      .innerJoin(Project, 'p', 'r.projectId = p.id')
      .leftJoin(ProjectMember, 'pm', 'pm.projectId = p.id AND pm.userId = :userId', { userId })
      .select([
        'r.id AS id',
        'r.projectId AS "projectId"',
        'r.providerId AS "providerId"',
        'r.remoteUrl AS "remoteUrl"',
        'r.repositoryName AS "repositoryName"',
        'r.defaultBranch AS "defaultBranch"',
        'r.lastCommitSha AS "lastCommitSha"',
        'r.lastSyncAt AS "lastSyncAt"',
        'p.name AS "projectName"',
      ])
      .where('(p.ownerId = :userId OR pm.userId = :userId)', { userId })
      .orderBy('r.createdAt', 'DESC');

    if (projectId) {
      qb.andWhere('r.projectId = :projectId', { projectId });
    }

    return qb.getRawMany();
  }

  /**
   * Get a single repository by ID, accessible by a user
   */
  async getByIdForUser(id: string, userId: string) {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const result = await gitRepoRepo.createQueryBuilder('r')
      .innerJoin(Project, 'p', 'r.projectId = p.id')
      .leftJoin(ProjectMember, 'pm', 'pm.projectId = p.id AND pm.userId = :userId', { userId })
      .select([
        'r.id AS id',
        'r.projectId AS "projectId"',
        'r.providerId AS "providerId"',
        'r.remoteUrl AS "remoteUrl"',
        'r.repositoryName AS "repositoryName"',
        'r.defaultBranch AS "defaultBranch"',
        'r.lastCommitSha AS "lastCommitSha"',
        'r.lastSyncAt AS "lastSyncAt"',
        'r.createdAt AS "createdAt"',
        'r.updatedAt AS "updatedAt"',
        'p.name AS "project_name"',
      ])
      .where('r.id = :id', { id })
      .andWhere('(p.ownerId = :userId OR pm.userId = :userId)', { userId })
      .getRawOne();

    if (!result) {
      throw Errors.notFound('Repository');
    }

    return result;
  }

  /**
   * Get the projectId for a repository, verifying user access
   */
  async getProjectIdForRepo(id: string, userId: string): Promise<string> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const repoRow = await gitRepoRepo.createQueryBuilder('r')
      .innerJoin(Project, 'p', 'r.projectId = p.id')
      .leftJoin(ProjectMember, 'pm', 'pm.projectId = p.id AND pm.userId = :userId', { userId })
      .select(['r.projectId AS "projectId"'])
      .where('r.id = :id', { id })
      .andWhere('(p.ownerId = :userId OR pm.userId = :userId)', { userId })
      .getRawOne();

    if (!repoRow) {
      throw Errors.notFound('Repository');
    }

    return repoRow.projectId;
  }

  /**
   * Get the full GitRepository entity for a project, verifying user access.
   * Returns the entity (not raw columns) so callers can use all fields.
   */
  async getEntityForProject(projectId: string, userId: string): Promise<InstanceType<typeof GitRepository>> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const repo = await gitRepoRepo.createQueryBuilder('r')
      .innerJoin(Project, 'p', 'r.projectId = p.id')
      .leftJoin(ProjectMember, 'pm', 'pm.projectId = p.id AND pm.userId = :userId', { userId })
      .where('r.projectId = :projectId', { projectId })
      .andWhere('(p.ownerId = :userId OR pm.userId = :userId)', { userId })
      .getOne();

    if (!repo) {
      throw Errors.notFound('Repository');
    }

    return repo;
  }

  /**
   * Update timestamp fields on a repository record
   */
  async updateTimestamps(repoId: string, fields: {
    lastSyncAt?: number;
    lastCommitSha?: string | null;
    lastValidatedAt?: number;
  }): Promise<void> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);
    await gitRepoRepo.update({ id: repoId }, {
      ...fields,
      updatedAt: Date.now(),
    } as any);
  }

  /**
   * Delete a repository record by ID
   */
  async deleteById(id: string): Promise<void> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);
    await gitRepoRepo.delete({ id });
  }
}

export const gitRepositoryQueryService = new GitRepositoryQueryServiceImpl();
