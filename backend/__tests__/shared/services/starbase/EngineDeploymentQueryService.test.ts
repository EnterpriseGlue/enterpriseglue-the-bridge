import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { EngineDeployment } from '@enterpriseglue/shared/db/entities/EngineDeployment.js';
import { EngineDeploymentArtifact } from '@enterpriseglue/shared/db/entities/EngineDeploymentArtifact.js';
import { File } from '@enterpriseglue/shared/db/entities/File.js';
import { FileCommitVersion } from '@enterpriseglue/shared/db/entities/FileCommitVersion.js';
import { Folder } from '@enterpriseglue/shared/db/entities/Folder.js';
import { engineDeploymentQueryService } from '@enterpriseglue/shared/services/starbase/EngineDeploymentQueryService.js';

vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('EngineDeploymentQueryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when there are no visible engines for project deployments', async () => {
    const result = await engineDeploymentQueryService.listProjectDeployments('project-1', [], 10);

    expect(result).toEqual([]);
    expect(getDataSource).not.toHaveBeenCalled();
  });

  it('normalizes legacy environment tags in project deployments', async () => {
    const deploymentRepo = {
      find: vi.fn().mockResolvedValue([
        { id: 'dep-legacy', engineId: '__env__', environmentTag: 'legacy-tag', deployedAt: 100 },
        { id: 'dep-engine', engineId: 'engine-1', environmentTag: 'prod', deployedAt: 90 },
      ]),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === EngineDeployment) return deploymentRepo;
        throw new Error('Unexpected repository');
      },
    });

    const result = await engineDeploymentQueryService.listProjectDeployments('project-1', ['__env__', 'engine-1'], 10);

    expect(deploymentRepo.find).toHaveBeenCalledWith({
      where: {
        engineId: expect.anything(),
        projectId: 'project-1',
      },
      order: { deployedAt: 'DESC' },
      take: 10,
    });
    expect(result).toEqual([
      { id: 'dep-legacy', engineId: '__env__', environmentTag: null, deployedAt: 100 },
      { id: 'dep-engine', engineId: 'engine-1', environmentTag: 'prod', deployedAt: 90 },
    ]);
  });

  it('returns the latest file deployments with deployment metadata and file commit versions', async () => {
    const fileRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 'file-1', name: 'Process', type: 'bpmn' }),
    };
    const artifactRepo = {
      find: vi.fn().mockResolvedValue([
        {
          engineId: 'engine-1',
          engineDeploymentId: 'dep-1',
          fileId: 'file-1',
          fileType: 'bpmn',
          fileName: 'Process',
          fileGitCommitId: 'commit-1',
          artifactKind: 'deployment',
          artifactKey: 'main',
          artifactVersion: 2,
          artifactId: 'artifact-1',
        },
        {
          engineId: 'engine-1',
          engineDeploymentId: 'dep-1',
          fileId: 'file-1',
          fileType: 'bpmn',
          fileName: 'Process',
          fileGitCommitId: 'commit-1',
          artifactKind: 'diagram',
          artifactKey: 'preview',
          artifactVersion: 1,
          artifactId: 'artifact-2',
        },
        {
          engineId: 'engine-1',
          engineDeploymentId: 'dep-0',
          fileId: 'file-1',
          fileType: 'bpmn',
          fileName: 'Process',
          fileGitCommitId: 'commit-older',
          artifactKind: 'deployment',
          artifactKey: 'old',
          artifactVersion: 1,
          artifactId: 'artifact-old',
        },
      ]),
    };
    const deploymentRepo = {
      find: vi.fn().mockResolvedValue([
        { id: 'dep-1', engineId: 'engine-1', engineName: 'Engine One', deployedAt: 300, environmentTag: 'prod' },
      ]),
    };
    const fileCommitVersionRepo = {
      find: vi.fn().mockResolvedValue([
        { commitId: 'commit-1', versionNumber: 7 },
      ]),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === File) return fileRepo;
        if (entity === EngineDeploymentArtifact) return artifactRepo;
        if (entity === EngineDeployment) return deploymentRepo;
        if (entity === FileCommitVersion) return fileCommitVersionRepo;
        throw new Error('Unexpected repository');
      },
    });

    const result = await engineDeploymentQueryService.listLatestFileDeployments('project-1', 'file-1', ['engine-1'], 5, 50);

    expect(result).toEqual([
      {
        engineId: 'engine-1',
        engineDeploymentId: 'dep-1',
        fileId: 'file-1',
        fileType: 'bpmn',
        fileName: 'Process',
        fileGitCommitId: 'commit-1',
        fileVersionNumber: 7,
        artifacts: [
          { kind: 'deployment', key: 'main', version: 2, id: 'artifact-1' },
          { kind: 'diagram', key: 'preview', version: 1, id: 'artifact-2' },
        ],
        deployedAt: 300,
        engineName: 'Engine One',
        environmentTag: 'prod',
      },
    ]);
  });

  it('throws when file deployment history is requested for a missing file', async () => {
    const fileRepo = {
      findOne: vi.fn().mockResolvedValue(null),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === File) return fileRepo;
        if (entity === EngineDeploymentArtifact) return { find: vi.fn() };
        if (entity === EngineDeployment) return { find: vi.fn() };
        if (entity === FileCommitVersion) return { find: vi.fn() };
        throw new Error('Unexpected repository');
      },
    });

    await expect(
      engineDeploymentQueryService.listFileDeploymentHistory('project-1', 'missing-file', ['engine-1'], 10, 100)
    ).rejects.toThrow(/File/);
  });

  it('maps latest project deployment artifacts from resource names and deployment metadata', async () => {
    const fileRepo = {
      find: vi.fn().mockResolvedValue([
        { id: 'file-1', name: 'Process', type: 'bpmn', folderId: 'folder-1' },
      ]),
    };
    const folderRepo = {
      find: vi.fn().mockResolvedValue([
        { id: 'folder-1', name: 'Parent Folder', parentFolderId: null },
      ]),
    };
    const artifactRepo = {
      find: vi.fn().mockResolvedValue([
        {
          engineId: 'engine-1',
          engineDeploymentId: 'dep-1',
          fileId: null,
          fileType: 'bpmn',
          fileName: 'Process',
          fileUpdatedAt: 111,
          fileContentHash: 'hash-1',
          fileGitCommitId: 'commit-1',
          fileGitCommitMessage: 'Initial commit',
          resourceName: 'Parent-Folder/Process.bpmn',
          artifactKind: 'deployment',
          artifactKey: 'main',
          artifactVersion: 3,
          artifactId: 'artifact-1',
        },
      ]),
    };
    const deploymentRepo = {
      find: vi.fn().mockResolvedValue([
        {
          id: 'dep-1',
          engineId: 'engine-1',
          engineName: 'Engine One',
          deployedAt: 444,
          environmentTag: 'stage',
          gitDeploymentId: 'git-deploy-1',
          gitCommitSha: 'abc123',
          gitCommitMessage: 'Deploy commit',
          camundaDeploymentId: 'cam-1',
          camundaDeploymentName: 'Camunda Deploy',
          camundaDeploymentTime: '2026-03-27T19:00:00Z',
        },
      ]),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === File) return fileRepo;
        if (entity === Folder) return folderRepo;
        if (entity === EngineDeploymentArtifact) return artifactRepo;
        if (entity === EngineDeployment) return deploymentRepo;
        throw new Error('Unexpected repository');
      },
    });

    const result = await engineDeploymentQueryService.listLatestProjectDeploymentArtifacts('project-1', ['engine-1'], 20);

    expect(result).toEqual([
      expect.objectContaining({
        engineId: 'engine-1',
        fileId: 'file-1',
        resourceName: 'Parent-Folder/Process.bpmn',
        deployedAt: 444,
        engineName: 'Engine One',
        environmentTag: 'stage',
        gitDeploymentId: 'git-deploy-1',
        gitCommitSha: 'abc123',
        camundaDeploymentId: 'cam-1',
      }),
    ]);
    expect(result[0].artifactVersions).toEqual({ 'deployment:main': 3 });
    expect(result[0].artifacts).toEqual([
      { kind: 'deployment', key: 'main', version: 3, id: 'artifact-1' },
    ]);
  });
});
