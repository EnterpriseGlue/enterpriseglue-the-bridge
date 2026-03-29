import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { Invitation } from '@enterpriseglue/shared/db/entities/Invitation.js';
import { ProjectMember } from '@enterpriseglue/shared/db/entities/ProjectMember.js';
import { User } from '@enterpriseglue/shared/db/entities/User.js';
import { In } from 'typeorm';

export type PendingInviteStatus = 'pending' | 'expired' | 'onboarding';
export type ProjectRole = 'owner' | 'delegate' | 'developer' | 'editor' | 'viewer';

export interface PendingProjectInviteResult {
  invitationId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: ProjectRole;
  roles: ProjectRole[];
  status: PendingInviteStatus;
  deliveryMethod: 'email' | 'manual';
  expiresAt: number;
  createdAt: number;
}

function parseInvitationRoles(value: string | null, fallbackRole: string | null): ProjectRole[] {
  try {
    const parsed = value ? JSON.parse(value) : [];
    const roles = Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    const normalized = roles.filter((item): item is ProjectRole => ['owner', 'delegate', 'developer', 'editor', 'viewer'].includes(item));
    if (normalized.length > 0) {
      return normalized;
    }
  } catch {
  }

  if (fallbackRole && ['owner', 'delegate', 'developer', 'editor', 'viewer'].includes(fallbackRole)) {
    return [fallbackRole as ProjectRole];
  }

  return ['viewer'];
}

function toPendingInviteStatus(invitation: Pick<Invitation, 'status' | 'expiresAt'>, now: number): PendingInviteStatus {
  if (invitation.status === 'otp_verified') {
    return 'onboarding';
  }

  if (invitation.expiresAt < now) {
    return 'expired';
  }

  return 'pending';
}

class InvitationQueryServiceImpl {
  async listPendingProjectInvites(projectId: string): Promise<PendingProjectInviteResult[]> {
    const dataSource = await getDataSource();
    const invitationRepo = dataSource.getRepository(Invitation);
    const userRepo = dataSource.getRepository(User);
    const projectMemberRepo = dataSource.getRepository(ProjectMember);
    const now = Date.now();

    const invitationRows = await invitationRepo.find({
      where: {
        resourceType: 'project',
        resourceId: projectId,
      },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (invitationRows.length === 0) {
      return [];
    }

    const latestByUser = new Map<string, Invitation>();
    for (const invitation of invitationRows) {
      const key = String(invitation.userId || invitation.email || invitation.id).toLowerCase();
      if (!latestByUser.has(key)) {
        latestByUser.set(key, invitation);
      }
    }

    const projectMembers = await projectMemberRepo.find({
      where: { projectId },
      select: ['userId'],
    });
    const activeMemberUserIds = new Set(projectMembers.map((member) => String(member.userId)));
    const unresolvedInvitationRows = Array.from(latestByUser.values()).filter((invitation) => {
      if (invitation.revokedAt || invitation.completedAt) {
        return false;
      }
      return !activeMemberUserIds.has(String(invitation.userId));
    });

    if (unresolvedInvitationRows.length === 0) {
      return [];
    }

    const userIds = Array.from(new Set(unresolvedInvitationRows.map((invitation) => String(invitation.userId)).filter(Boolean)));
    const users = userIds.length > 0
      ? await userRepo.find({
          where: { id: In(userIds) },
          select: ['id', 'firstName', 'lastName'],
        })
      : [];
    const userMap = new Map(users.map((user) => [String(user.id), user]));

    return unresolvedInvitationRows.map((invitation) => {
      const roles = parseInvitationRoles(invitation.resourceRolesJson, invitation.resourceRole);
      const user = userMap.get(String(invitation.userId));
      return {
        invitationId: invitation.id,
        userId: String(invitation.userId),
        email: invitation.email,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        role: roles[0] || 'viewer',
        roles,
        status: toPendingInviteStatus(invitation, now),
        deliveryMethod: invitation.deliveryMethod,
        expiresAt: Number(invitation.expiresAt),
        createdAt: Number(invitation.createdAt),
      };
    });
  }

  async getProjectInvitation(invitationId: string, projectId: string): Promise<Invitation | null> {
    const dataSource = await getDataSource();
    return dataSource.getRepository(Invitation).findOne({
      where: {
        id: invitationId,
        resourceType: 'project',
        resourceId: projectId,
      },
    });
  }
}

export const invitationQueryService = new InvitationQueryServiceImpl();
