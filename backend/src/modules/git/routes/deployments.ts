import { Router, Request, Response } from 'express';
import { GitService } from '@shared/services/git/GitService.js';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { validateBody } from '@shared/middleware/validate.js';
import { requireAuth } from '@shared/middleware/auth.js';
import { requireProjectRole } from '@shared/middleware/projectAuth.js';
import { DeployRequestSchema, RollbackRequestSchema } from '@shared/schemas/git/index.js';
import { projectMemberService } from '@shared/services/platform-admin/ProjectMemberService.js';
import { getDataSource } from '@shared/db/data-source.js';
import { GitDeployment } from '@shared/db/entities/GitDeployment.js';
import { EDIT_ROLES } from '@shared/constants/roles.js';

const router = Router();
const gitService = new GitService();

/**
 * POST /git-api/deploy
 * Deploy a project (commit + push + tag)
 */
router.post('/git-api/deploy', requireAuth, validateBody(DeployRequestSchema), requireProjectRole(EDIT_ROLES, { projectIdFrom: 'body' }), asyncHandler(async (req: Request, res: Response) => {
  const validated = req.body;
  const userId = req.user!.userId;

  try {
    const result = await gitService.deployProject({
      projectId: validated.projectId,
      message: validated.message,
      userId,
      environment: validated.environment,
      createTag: validated.createTag,
      tagName: validated.tagName,
    });

    res.status(201).json(result);
  } catch (e: any) {
    const msg = String(e?.message || '')

    if (msg.includes('Project is not connected to Git')) {
      return res.status(400).json({
        error: 'Project is not connected to Git',
        hint: 'Connect Git from Starbase → Project Overview (⋯) → Connect to Git',
      })
    }

    if (msg.includes('No Git credentials found')) {
      return res.status(403).json({
        error: 'No Git credentials found for this provider',
        hint: 'Open Starbase → Project Overview (⋯) → Edit Git settings and connect an account/token',
      })
    }

    if (msg.includes('No files to push')) {
      return res.status(400).json({
        error: 'No files to push',
        hint: 'Add at least one BPMN or DMN file to the project before pushing to Git',
      })
    }

    if (msg.includes('Tagging not supported')) {
      return res.status(501).json({
        error: 'Git tagging is not supported yet',
        hint: 'Try again with createTag disabled, or use your Git provider UI to create a tag for the pushed commit',
      })
    }

    throw e;
  }
}));

/**
 * Shared helper for listing deployments
 */
async function listDeployments(projectId: string, limit: number) {
  const dataSource = await getDataSource();
  const deploymentRepo = dataSource.getRepository(GitDeployment);
  return deploymentRepo.find({
    where: { projectId },
    order: { deployedAt: 'DESC' },
    take: limit,
  });
}

/**
 * GET /git-api/deployments
 * List deployments for a project (query param style)
 */
router.get('/git-api/deployments', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!projectId) {
    throw Errors.validation('projectId query parameter is required');
  }

  const canRead = await projectMemberService.hasAccess(projectId, req.user!.userId);
  if (!canRead) {
    throw Errors.projectNotFound();
  }

  res.json(await listDeployments(projectId, limit));
}));

/**
 * GET /git-api/projects/:projectId/deployments
 * List deployments for a project (REST style)
 */
router.get('/git-api/projects/:projectId/deployments', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const canRead = await projectMemberService.hasAccess(projectId, req.user!.userId);
  if (!canRead) {
    throw Errors.projectNotFound();
  }

  res.json(await listDeployments(projectId, limit));
}));

/**
 * GET /git-api/deployments/:id
 * Get deployment details
 */
router.get('/git-api/deployments/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const dataSource = await getDataSource();
  const deploymentRepo = dataSource.getRepository(GitDeployment);
  const deployment = await deploymentRepo.findOneBy({ id });

  if (!deployment) {
    throw Errors.notFound('Deployment');
  }

  const canRead = await projectMemberService.hasAccess(String(deployment.projectId), req.user!.userId);
  if (!canRead) {
    throw Errors.notFound('Deployment');
  }

  res.json(deployment);
}));

/**
 * POST /git-api/rollback
 * Rollback project to a specific commit
 */
router.post('/git-api/rollback', requireAuth, validateBody(RollbackRequestSchema), requireProjectRole(EDIT_ROLES, { projectIdFrom: 'body' }), asyncHandler(async (req: Request, res: Response) => {
  const validated = req.body;
  const userId = req.user!.userId;

  await gitService.rollbackToCommit(validated.projectId, validated.commitSha, userId);

  res.json({
    success: true,
    message: `Rolled back to commit ${validated.commitSha}`,
  });
}));

/**
 * GET /git-api/commits
 * Get commit history for a project
 */
router.get('/git-api/commits', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  const limit = parseInt(req.query.limit as string) || 100;

  if (!projectId) {
    throw Errors.validation('projectId query parameter is required');
  }

  const canRead = await projectMemberService.hasAccess(projectId, req.user!.userId);
  if (!canRead) {
    throw Errors.projectNotFound();
  }

  const commits = await gitService.getCommitHistory(projectId, req.user!.userId, limit);
  res.json(commits);
}));

export default router;
