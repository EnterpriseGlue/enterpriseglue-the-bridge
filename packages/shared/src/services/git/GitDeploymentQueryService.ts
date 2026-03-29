import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { GitDeployment } from '@enterpriseglue/shared/db/entities/GitDeployment.js';
import { EnvironmentTag } from '@enterpriseglue/shared/db/entities/EnvironmentTag.js';
import { Errors } from '@enterpriseglue/shared/middleware/errorHandler.js';
import { generateId } from '@enterpriseglue/shared/utils/id.js';
import { logger } from '@enterpriseglue/shared/utils/logger.js';

class GitDeploymentQueryServiceImpl {
  /**
   * List deployments for a project, ordered by most recent first
   */
  async listForProject(projectId: string, limit: number = 50) {
    const dataSource = await getDataSource();
    const deploymentRepo = dataSource.getRepository(GitDeployment);
    return deploymentRepo.find({
      where: { projectId },
      order: { deployedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get a single deployment by ID
   */
  async getById(id: string) {
    const dataSource = await getDataSource();
    const deploymentRepo = dataSource.getRepository(GitDeployment);
    const deployment = await deploymentRepo.findOneBy({ id });
    if (!deployment) {
      throw Errors.notFound('Deployment');
    }
    return deployment;
  }

  /**
   * Check if manual deploy is allowed for an environment
   */
  async isManualDeployAllowed(environment: string): Promise<{ allowed: boolean; envName?: string }> {
    const dataSource = await getDataSource();
    const envTagRepo = dataSource.getRepository(EnvironmentTag);
    let envTag = await envTagRepo.findOneBy({ id: environment });
    if (!envTag) {
      const allTags = await envTagRepo.find();
      envTag = allTags.find(t => t.name.toLowerCase() === environment.toLowerCase()) || null;
    }
    if (envTag && !envTag.manualDeployAllowed) {
      return { allowed: false, envName: envTag.name };
    }
    return { allowed: true };
  }

  /**
   * Record a deployment from a sync push operation
   */
  async recordSyncDeployment(input: {
    projectId: string;
    repositoryId: string;
    commitSha: string;
    commitMessage: string;
    deployedBy: string;
    filesChanged: number;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    try {
      const dataSource = await getDataSource();
      const deploymentRepo = dataSource.getRepository(GitDeployment);
      await deploymentRepo.insert({
        id: generateId(),
        projectId: input.projectId,
        repositoryId: input.repositoryId,
        commitSha: input.commitSha,
        commitMessage: input.commitMessage,
        tag: null,
        deployedBy: input.deployedBy,
        deployedAt: Date.now(),
        environment: 'sync',
        status: 'success',
        errorMessage: null,
        filesChanged: input.filesChanged,
        metadata: JSON.stringify(input.metadata),
      } as any);
    } catch (e) {
      logger.warn('Failed to record git deployment for sync push', { projectId: input.projectId, error: e });
    }
  }
}

export const gitDeploymentQueryService = new GitDeploymentQueryServiceImpl();
