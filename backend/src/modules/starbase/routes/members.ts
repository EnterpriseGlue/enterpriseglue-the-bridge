/**
 * Project Members API Routes
 * Handles project collaboration - inviting members, managing roles
 */

import { Router } from 'express';
import { logger } from '@shared/utils/logger.js';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { requireAuth } from '@shared/middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '@shared/middleware/validate.js';
import { asyncHandler, Errors } from '@shared/middleware/errorHandler.js';
import { apiLimiter } from '@shared/middleware/rateLimiter.js';
import { projectMemberService } from '@shared/services/platform-admin/ProjectMemberService.js';
import { getDataSource } from '@shared/db/data-source.js';
import { User } from '@shared/db/entities/User.js';
import { ProjectMember } from '@shared/db/entities/ProjectMember.js';
import { PermissionGrant } from '@shared/db/entities/PermissionGrant.js';
import { Invitation } from '@shared/db/entities/Invitation.js';
import { Tenant } from '@shared/db/entities/Tenant.js';
import { Project } from '@shared/db/entities/Project.js';
import { generateId } from '@shared/utils/id.js';
import { In, IsNull, Not, Raw } from 'typeorm';
import { sendInvitationEmail } from '@shared/services/email/index.js';
import { config } from '@shared/config/index.js';
import { MANAGE_ROLES } from '@shared/constants/roles.js';
import { requireProjectRole, requireProjectAccess } from '@shared/middleware/projectAuth.js';

type ProjectRole = 'owner' | 'delegate' | 'developer' | 'editor' | 'viewer';

// Type for membership with roles array
interface MembershipWithRoles {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  roles: ProjectRole[];
  invitedById: string | null;
  joinedAt: number;
  createdAt: number;
  updatedAt: number;
}

// Helper to extract roles from membership
function getRolesFromMembership(membership: MembershipWithRoles | null): ProjectRole[] {
  if (!membership) return [];
  return Array.isArray(membership.roles) ? membership.roles : [membership.role];
}

const router = Router();

// Validation schemas
const projectIdSchema = z.object({
  projectId: z.string().uuid(),
});

const memberIdSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['delegate', 'developer', 'editor', 'viewer']).optional(),
  roles: z.array(z.enum(['delegate', 'developer', 'editor', 'viewer'])).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['delegate', 'developer', 'editor', 'viewer']).optional(),
  roles: z.array(z.enum(['delegate', 'developer', 'editor', 'viewer'])).optional(),
});

const updateDeployGrantSchema = z.object({
  allowed: z.boolean(),
});

const userSearchSchema = z.object({
  q: z.string().optional(),
});
router.get(
  '/starbase-api/projects/:projectId/members/user-search',
  apiLimiter,
  requireAuth,
  validateParams(projectIdSchema),
  validateQuery(userSearchSchema),
  requireProjectRole(MANAGE_ROLES, { errorStatus: 403, errorMessage: 'Only owners and delegates can search users' }),
  asyncHandler(async (req, res) => {
    try {
      const { projectId } = req.params;
      const q = typeof req.query?.q === 'string' ? String(req.query.q).trim() : '';

      if (q.length < 2) {
        return res.json([]);
      }

      const dataSource = await getDataSource();
      const memberRepo = dataSource.getRepository(ProjectMember);
      const userRepo = dataSource.getRepository(User);

      const existingMemberRows = await memberRepo.find({
        where: { projectId },
        select: ['userId']
      });
      const existingMemberIds = existingMemberRows.map((r) => r.userId);

      const qb = userRepo.createQueryBuilder('u')
        .select(['u.id', 'u.email', 'u.firstName', 'u.lastName'])
        .where('(LOWER(u.email) LIKE :q OR LOWER(u.firstName) LIKE :q OR LOWER(u.lastName) LIKE :q)', { q: `%${q.toLowerCase()}%` })
        .orderBy('u.email', 'ASC')
        .limit(20);

      if (existingMemberIds.length > 0) {
        qb.andWhere('u.id NOT IN (:...existingIds)', { existingIds: existingMemberIds });
      }

      const result = await qb.getMany();

      res.json(result);
    } catch (error) {
      logger.error('Search users for project members error:', error);
      throw Errors.internal('Failed to search users');
    }
  })
);

router.put(
  '/starbase-api/projects/:projectId/members/:userId/deploy-permission',
  apiLimiter,
  requireAuth,
  validateParams(memberIdSchema),
  validateBody(updateDeployGrantSchema),
  requireProjectRole(MANAGE_ROLES, { errorStatus: 403, errorMessage: 'Only owners and delegates can manage deploy permissions' }),
  asyncHandler(async (req, res) => {
    try {
      const { projectId, userId: targetUserId } = req.params;
      const requesterId = req.user!.userId;
      const { allowed } = req.body as { allowed: boolean };

      const targetMembership = await projectMemberService.getMembership(projectId, targetUserId);
      if (!targetMembership) {
        throw Errors.projectNotFound();
      }

      if (targetMembership.role !== 'editor') {
        throw Errors.validation('Deploy permission can only be granted to Editors');
      }

      const dataSource = await getDataSource();
      const grantRepo = dataSource.getRepository(PermissionGrant);
      const now = Date.now();

      if (allowed) {
        await grantRepo.createQueryBuilder()
          .insert()
          .values({
            id: generateId(),
            userId: targetUserId,
            permission: 'project:deploy',
            resourceType: 'project',
            resourceId: projectId,
            grantedById: requesterId,
            createdAt: now,
          })
          .orIgnore()
          .execute();
      } else {
        await grantRepo.createQueryBuilder()
          .delete()
          .where('userId = :userId', { userId: targetUserId })
          .andWhere('permission IN (:...perms)', { perms: ['project:deploy', 'project.deploy'] })
          .andWhere('resourceType = :resourceType', { resourceType: 'project' })
          .andWhere('resourceId = :resourceId', { resourceId: projectId })
          .execute();
      }

      res.json({ allowed });
    } catch (error) {
      logger.error('Update deploy permission error:', error);
      throw Errors.internal('Failed to update deploy permission');
    }
  })
);

/**
 * GET /starbase-api/projects/:projectId/members
 * List all members of a project
 */
router.get(
  '/starbase-api/projects/:projectId/members',
  apiLimiter,
  requireAuth,
  validateParams(projectIdSchema),
  asyncHandler(async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;

      // Check if user has access to project
      const hasAccess = await projectMemberService.hasAccess(projectId, userId);
      if (!hasAccess) {
        throw Errors.forbidden();
      }

      const members = await projectMemberService.getMembers(projectId);

      const editorIds = members
        .filter((m: any) => String(m.role) === 'editor')
        .map((m: any) => String(m.userId));

      let deployGrantSet = new Set<string>();
      if (editorIds.length > 0) {
        const dataSource = await getDataSource();
        const grantRepo = dataSource.getRepository(PermissionGrant);
        const deployGrantRows = await grantRepo.createQueryBuilder('pg')
          .select(['pg.userId'])
          .where('pg.userId IN (:...editorIds)', { editorIds })
          .andWhere('pg.permission IN (:...perms)', { perms: ['project:deploy', 'project.deploy'] })
          .andWhere('pg.resourceType = :resourceType', { resourceType: 'project' })
          .andWhere('pg.resourceId = :resourceId', { resourceId: projectId })
          .getMany();
        deployGrantSet = new Set(deployGrantRows.map((r) => String(r.userId)));
      }

      res.json(members.map((m: any) => ({
        ...m,
        deployAllowed: String(m.role) === 'editor' ? deployGrantSet.has(String(m.userId)) : null,
      })));
    } catch (error) {
      logger.error('Get project members error:', error);
      throw Errors.internal('Failed to get project members');
    }
  })
);

/**
 * POST /starbase-api/projects/:projectId/members
 * Add a new member to a project
 */
router.post(
  '/starbase-api/projects/:projectId/members',
  apiLimiter,
  requireAuth,
  validateParams(projectIdSchema),
  validateBody(addMemberSchema),
  requireProjectRole(MANAGE_ROLES, { errorStatus: 403, errorMessage: 'Only owners and delegates can add members' }),
  asyncHandler(async (req, res) => {
    try {
      const { projectId } = req.params;
      const { email, role, roles } = req.body as { email: string; role?: ProjectRole; roles?: ProjectRole[] };
      const inviterId = req.user!.userId;

      if (typeof email !== 'string') {
        throw Errors.validation('Invalid email address');
      }
      const emailLower = email.toLowerCase();

      const requestedRoles: ProjectRole[] = Array.isArray(roles) && roles.length > 0
        ? roles
        : (role ? [role] : (['viewer'] as ProjectRole[]));

      const inviterMembership = await projectMemberService.getMembership(projectId, inviterId) as MembershipWithRoles | null;
      const inviterRoles = getRolesFromMembership(inviterMembership);
      const inviterIsOwner = inviterRoles.includes('owner');

      if (!inviterIsOwner && (requestedRoles.includes('owner') || requestedRoles.includes('delegate'))) {
        throw Errors.forbidden('Delegates cannot assign owner or delegate role to new members');
      }

      // Find user by email
      const dataSource = await getDataSource();
      const userRepo = dataSource.getRepository(User);
      const targetUser = await userRepo.createQueryBuilder('u')
        .select(['u.id', 'u.email'])
        .where('LOWER(u.email) = :email', { email: emailLower })
        .getOne();

      // If user exists, add them directly as a member
      if (targetUser) {
        // Check if user is already a member
        const existingMembership = await projectMemberService.getMembership(projectId, targetUser.id);
        if (existingMembership) {
          throw Errors.conflict('User is already a member of this project');
        }

        // Add the member directly
        const member = await projectMemberService.addMember(projectId, targetUser.id, requestedRoles, inviterId);

        return res.status(201).json({
          ...member,
          user: {
            id: targetUser.id,
            email: targetUser.email,
          },
          invited: false,
        });
      }

      // User doesn't exist - create an invitation instead
      // Get the tenant for this project (use default tenant if not multi-tenant)
      const projectRepo = dataSource.getRepository(Project);
      const projectResult = await projectRepo.findOne({
        where: { id: projectId },
        select: ['tenantId']
      });
      
      const tenantId = String(projectResult?.tenantId || 'tenant-default');

      // Get tenant info for the invitation
      const tenantRepo = dataSource.getRepository(Tenant);
      const tenantResult = await tenantRepo.findOne({
        where: { id: tenantId },
        select: ['slug', 'name']
      });
      
      const tenant = tenantResult || { slug: 'default', name: 'Default' };

      // Check for existing pending invitation
      const inviteRepo = dataSource.getRepository(Invitation);
      const existingInvite = await inviteRepo.createQueryBuilder('i')
        .where('i.tenantId = :tenantId', { tenantId })
        .andWhere('LOWER(i.email) = :email', { email: emailLower })
        .andWhere('i.resourceType = :resourceType', { resourceType: 'project' })
        .andWhere('i.resourceId = :resourceId', { resourceId: projectId })
        .andWhere('i.acceptedAt IS NULL')
        .andWhere('i.revokedAt IS NULL')
        .getOne();

      if (existingInvite) {
        throw Errors.conflict('An invitation is already pending for this email');
      }

      // Create the invitation
      const token = randomBytes(32).toString('hex');
      const now = Date.now();
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
      const invitationId = generateId();

      await inviteRepo.insert({
        id: invitationId,
        token,
        email: emailLower,
        tenantId,
        resourceType: 'project',
        resourceId: projectId,
        role: requestedRoles[0] || 'viewer',
        invitedByUserId: inviterId,
        expiresAt,
        createdAt: now,
      });

      // Send invitation email
      const inviteUrl = `${config.frontendUrl}/t/${tenant.slug}/invite/${token}`;
      let emailSent = false;
      let emailError: string | undefined;

      try {
        const result = await sendInvitationEmail({
          to: emailLower,
          tenantName: tenant.name,
          inviteUrl,
          resourceType: 'project',
          invitedByName: req.user!.email,
        });
        emailSent = result.success;
        emailError = result.error;
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Failed to send email';
      }

      res.status(201).json({
        id: invitationId,
        email: emailLower,
        role: requestedRoles[0] || 'viewer',
        invited: true,
        emailSent,
        emailError,
      });
    } catch (error) {
      logger.error('Add project member error:', error);
      throw Errors.internal('Failed to add project member');
    }
  })
);

/**
 * PATCH /starbase-api/projects/:projectId/members/:userId
 * Update a member's role
 */
router.patch(
  '/starbase-api/projects/:projectId/members/:userId',
  apiLimiter,
  requireAuth,
  validateParams(memberIdSchema),
  validateBody(updateRoleSchema),
  requireProjectRole(MANAGE_ROLES, { errorStatus: 403, errorMessage: 'Only owners and delegates can update roles' }),
  asyncHandler(async (req, res) => {
    try {
      const { projectId, userId: targetUserId } = req.params;
      const { role, roles } = req.body as { role?: ProjectRole; roles?: ProjectRole[] };
      const requesterId = req.user!.userId;

      // Can't change owner role through this endpoint unless requester is owner
      const targetMembership = await projectMemberService.getMembership(projectId, targetUserId);
      if (!targetMembership) {
        throw Errors.projectNotFound();
      }
      const targetRoles = getRolesFromMembership(targetMembership as MembershipWithRoles);
      const requesterMembership = await projectMemberService.getMembership(projectId, requesterId) as MembershipWithRoles | null;
      const requesterRoles = getRolesFromMembership(requesterMembership);
      const requesterIsOwner = requesterRoles.includes('owner');

      if (targetRoles.includes('owner') && !requesterIsOwner) {
        throw Errors.validation('Cannot change owner role. Use transfer ownership instead.');
      }

      const requestedRoles = Array.isArray(roles) && roles.length > 0
        ? roles
        : (role ? [role] : []);
      if (requestedRoles.length === 0) {
        throw Errors.validation('No roles provided');
      }

      // Delegates can't promote to delegate or owner
      if (requesterRoles.includes('delegate') && (requestedRoles.includes('delegate') || requestedRoles.includes('owner'))) {
        throw Errors.forbidden('Delegates cannot assign owner or delegate role');
      }

      await projectMemberService.updateRoles(projectId, targetUserId, requestedRoles);

      res.json({ message: 'Role updated successfully' });
    } catch (error) {
      logger.error('Update member role error:', error);
      throw Errors.internal('Failed to update member role');
    }
  })
);

/**
 * DELETE /starbase-api/projects/:projectId/members/:userId
 * Remove a member from a project
 */
router.delete(
  '/starbase-api/projects/:projectId/members/:userId',
  apiLimiter,
  requireAuth,
  validateParams(memberIdSchema),
  asyncHandler(async (req, res) => {
    try {
      const { projectId, userId: targetUserId } = req.params;
      const requesterId = req.user!.userId;

      // Check if requester has permission (owner or delegate, or removing self)
      const isSelf = requesterId === targetUserId;
      const canManage = await projectMemberService.hasRole(projectId, requesterId, MANAGE_ROLES);
      
      if (!isSelf && !canManage) {
        throw Errors.forbidden();
      }

      // Check target membership exists
      const targetMembership = await projectMemberService.getMembership(projectId, targetUserId);
      if (!targetMembership) {
        throw Errors.projectNotFound();
      }

      const targetRoles = getRolesFromMembership(targetMembership as MembershipWithRoles);

      // Can't remove the owner
      if (targetRoles.includes('owner')) {
        throw Errors.validation('Cannot remove the project owner');
      }

      await projectMemberService.removeMember(projectId, targetUserId);

      res.status(204).send();
    } catch (error) {
      logger.error('Remove member error:', error);
      throw Errors.internal('Failed to remove member');
    }
  })
);

/**
 * POST /starbase-api/projects/:projectId/transfer-ownership
 * Transfer project ownership to another member
 */
router.post(
  '/starbase-api/projects/:projectId/transfer-ownership',
  apiLimiter,
  requireAuth,
  validateParams(projectIdSchema),
  validateBody(z.object({ newOwnerId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    try {
      const { projectId } = req.params;
      const { newOwnerId } = req.body;
      const currentOwnerId = req.user!.userId;

      // Only owner can transfer ownership
      const isOwner = await projectMemberService.hasRole(projectId, currentOwnerId, ['owner']);
      if (!isOwner) {
        throw Errors.userNotFound();
      }

      // New owner must already be a member
      const newOwnerMembership = await projectMemberService.getMembership(projectId, newOwnerId);
      if (!newOwnerMembership) {
        throw Errors.userNotFound();
      }

      await projectMemberService.transferOwnership(projectId, currentOwnerId, newOwnerId);

      res.json({ message: 'Ownership transferred successfully' });
    } catch (error) {
      logger.error('Transfer ownership error:', error);
      throw Errors.internal('Failed to transfer ownership');
    }
  })
);

/**
 * Get current user's membership in a project
 */
router.get(
  '/starbase-api/projects/:projectId/members/me',
  apiLimiter,
  requireAuth,
  validateParams(projectIdSchema),
  asyncHandler(async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;

      const membership = await projectMemberService.getMembership(projectId, userId);
      if (!membership) {
        throw Errors.notFound('Membership');
      }

      res.json(membership);
    } catch (error) {
      logger.error('Get my membership error:', error);
      throw Errors.internal('Failed to get membership');
    }
  })
);

export default router;
