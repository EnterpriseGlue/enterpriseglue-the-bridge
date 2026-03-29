import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { GitRepository } from '@enterpriseglue/shared/db/entities/GitRepository.js';
import { GitAuditLog } from '@enterpriseglue/shared/db/entities/GitAuditLog.js';
import { generateId } from '@enterpriseglue/shared/utils/id.js';
import { encrypt } from '@enterpriseglue/shared/services/encryption.js';
import { logger } from '@enterpriseglue/shared/utils/logger.js';

export interface ProjectConnectionInfo {
  connected: boolean;
  providerId?: string;
  repositoryName?: string;
  namespace?: string | null;
  defaultBranch?: string;
  remoteUrl?: string;
  hasToken?: boolean;
  lastValidatedAt?: number | null;
  tokenScopeHint?: string | null;
  connectedByUserId?: string | null;
  lastSyncAt?: number | null;
}

class GitConnectionServiceImpl {
  async getProjectConnection(projectId: string): Promise<ProjectConnectionInfo> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const repo = await gitRepoRepo.findOne({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });

    if (!repo) {
      return { connected: false };
    }

    return {
      connected: true,
      providerId: repo.providerId,
      repositoryName: repo.repositoryName,
      namespace: repo.namespace,
      defaultBranch: repo.defaultBranch,
      remoteUrl: repo.remoteUrl,
      hasToken: !!repo.encryptedToken,
      lastValidatedAt: repo.lastValidatedAt ? Number(repo.lastValidatedAt) : null,
      tokenScopeHint: repo.tokenScopeHint,
      connectedByUserId: repo.connectedByUserId,
      lastSyncAt: repo.lastSyncAt ? Number(repo.lastSyncAt) : null,
    };
  }

  async connectProject(input: {
    projectId: string;
    providerId: string;
    repositoryName: string;
    namespace?: string;
    defaultBranch: string;
    token: string;
    userId: string;
  }): Promise<{ success: true; repoFullName: string }> {
    const { projectId, providerId, repositoryName, namespace, defaultBranch, token, userId } = input;
    const repoFullName = namespace ? `${namespace}/${repositoryName}` : repositoryName;

    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);
    const now = Date.now();

    const existing = await gitRepoRepo.findOne({ where: { projectId }, order: { createdAt: 'DESC' } });

    if (existing) {
      await gitRepoRepo.update({ id: existing.id }, {
        providerId,
        repositoryName,
        namespace: namespace || null,
        defaultBranch,
        encryptedToken: encrypt(token),
        lastValidatedAt: now,
        connectedByUserId: userId,
        updatedAt: now,
      });
      logger.info('Updated project Git connection', { projectId, repoFullName, userId });
    } else {
      await gitRepoRepo.insert({
        id: generateId(),
        projectId,
        providerId,
        connectedByUserId: userId,
        remoteUrl: `https://github.com/${repoFullName}`,
        namespace: namespace || null,
        repositoryName,
        defaultBranch,
        encryptedToken: encrypt(token),
        lastValidatedAt: now,
        lastCommitSha: null,
        lastSyncAt: null,
        clonePath: `vcs://${projectId}`,
        createdAt: now,
        updatedAt: now,
      });
      logger.info('Created project Git connection', { projectId, repoFullName, userId });
    }

    await this.logAudit(dataSource, {
      repositoryId: existing?.id || null,
      userId,
      operation: existing ? 'update-connection' : 'create-connection',
      details: { projectId, repoFullName, providerId },
    });

    return { success: true, repoFullName };
  }

  async updateToken(input: {
    projectId: string;
    token: string;
    userId: string;
  }): Promise<{ repoFullName: string }> {
    const { projectId, token, userId } = input;

    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const repo = await gitRepoRepo.findOne({ where: { projectId }, order: { createdAt: 'DESC' } });
    if (!repo) {
      const { Errors } = await import('@enterpriseglue/shared/middleware/errorHandler.js');
      throw Errors.notFound('Git connection');
    }

    const repoFullName = repo.namespace ? `${repo.namespace}/${repo.repositoryName}` : repo.repositoryName;

    const now = Date.now();
    await gitRepoRepo.update({ id: repo.id }, {
      encryptedToken: encrypt(token),
      lastValidatedAt: now,
      connectedByUserId: userId,
      updatedAt: now,
    });

    await this.logAudit(dataSource, {
      repositoryId: repo.id,
      userId,
      operation: 'update-token',
      details: { projectId, repoFullName },
    });

    logger.info('Updated project Git token', { projectId, repoFullName, userId });
    return { repoFullName };
  }

  async getRepoForValidation(projectId: string) {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);
    return gitRepoRepo.findOne({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  /**
   * Insert a new repository record (used by clone and createOnline flows).
   * Returns the generated repository ID.
   */
  async insertRepository(input: {
    projectId: string;
    providerId: string;
    userId: string;
    remoteUrl: string;
    namespace: string | null;
    repositoryName: string;
    defaultBranch: string;
    accessToken: string | null;
    lastCommitSha?: string | null;
    lastSyncAt?: number | null;
  }): Promise<string> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const repositoryId = generateId();
    const now = Date.now();

    await gitRepoRepo.insert({
      id: repositoryId,
      projectId: input.projectId,
      providerId: input.providerId,
      connectedByUserId: input.userId,
      remoteUrl: input.remoteUrl,
      namespace: input.namespace,
      repositoryName: input.repositoryName,
      defaultBranch: input.defaultBranch,
      encryptedToken: input.accessToken ? encrypt(input.accessToken) : null,
      lastValidatedAt: now,
      lastCommitSha: input.lastCommitSha ?? null,
      lastSyncAt: input.lastSyncAt ?? null,
      clonePath: `vcs://${input.projectId}`,
      createdAt: now,
      updatedAt: now,
    });

    await this.logAudit(dataSource, {
      repositoryId,
      userId: input.userId,
      operation: 'create-connection',
      details: {
        projectId: input.projectId,
        repoFullName: input.namespace ? `${input.namespace}/${input.repositoryName}` : input.repositoryName,
        providerId: input.providerId,
        source: 'clone',
      },
    });

    return repositoryId;
  }

  /**
   * Delete any existing repo link for a project, then insert a new one.
   * Used by createOnline flow.
   */
  async replaceAndLinkRepository(input: Parameters<GitConnectionServiceImpl['insertRepository']>[0]): Promise<string> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);
    await gitRepoRepo.delete({ projectId: input.projectId });
    return this.insertRepository(input);
  }

  async disconnectProject(projectId: string, userId: string): Promise<void> {
    const dataSource = await getDataSource();
    const gitRepoRepo = dataSource.getRepository(GitRepository);

    const deleted = await gitRepoRepo.delete({ projectId });
    logger.info('Disconnected project from Git', { projectId, userId, affected: deleted.affected });

    await this.logAudit(dataSource, {
      repositoryId: null,
      userId,
      operation: 'disconnect',
      details: { projectId },
    });
  }

  private async logAudit(
    dataSource: Awaited<ReturnType<typeof getDataSource>>,
    entry: { repositoryId: string | null; userId: string; operation: string; details: Record<string, any> }
  ): Promise<void> {
    try {
      const auditRepo = dataSource.getRepository(GitAuditLog);
      await auditRepo.insert({
        id: generateId(),
        repositoryId: entry.repositoryId,
        userId: entry.userId,
        operation: entry.operation,
        details: JSON.stringify(entry.details),
        status: 'success',
        errorMessage: null,
        duration: null,
        createdAt: Date.now(),
      });
    } catch (e) {
      logger.warn('Failed to write git audit log', { operation: entry.operation, error: e });
    }
  }
}

export const gitConnectionService = new GitConnectionServiceImpl();
