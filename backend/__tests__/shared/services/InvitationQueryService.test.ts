import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { getDataSource } from '@enterpriseglue/shared/db/data-source.js';
import { Invitation } from '@enterpriseglue/shared/db/entities/Invitation.js';
import { ProjectMember } from '@enterpriseglue/shared/db/entities/ProjectMember.js';
import { User } from '@enterpriseglue/shared/db/entities/User.js';
import { invitationQueryService } from '@enterpriseglue/shared/services/InvitationQueryService.js';

vi.mock('@enterpriseglue/shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('InvitationQueryService', () => {
  const now = 1_700_000_000_000;

  let invitationRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let userRepo: {
    find: ReturnType<typeof vi.fn>;
  };
  let projectMemberRepo: {
    find: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    invitationRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
    };
    userRepo = {
      find: vi.fn(),
    };
    projectMemberRepo = {
      find: vi.fn(),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === Invitation) return invitationRepo;
        if (entity === User) return userRepo;
        if (entity === ProjectMember) return projectMemberRepo;
        throw new Error('Unexpected repository');
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty list when no invitations exist', async () => {
    invitationRepo.find.mockResolvedValue([]);

    const result = await invitationQueryService.listPendingProjectInvites('project-1');

    expect(result).toEqual([]);
    expect(invitationRepo.find).toHaveBeenCalledWith({
      where: {
        resourceType: 'project',
        resourceId: 'project-1',
      },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
    expect(projectMemberRepo.find).not.toHaveBeenCalled();
  });

  it('returns the latest unresolved invites with normalized roles and statuses', async () => {
    invitationRepo.find.mockResolvedValue([
      {
        id: 'inv-latest',
        userId: 'user-1',
        email: 'one@example.com',
        resourceRole: 'viewer',
        resourceRolesJson: '["editor","invalid"]',
        status: 'otp_verified',
        expiresAt: now + 10_000,
        createdAt: 200,
        updatedAt: 300,
        revokedAt: null,
        completedAt: null,
        deliveryMethod: 'email',
      },
      {
        id: 'inv-older',
        userId: 'user-1',
        email: 'one@example.com',
        resourceRole: 'viewer',
        resourceRolesJson: null,
        status: 'pending',
        expiresAt: now + 5_000,
        createdAt: 100,
        updatedAt: 200,
        revokedAt: null,
        completedAt: null,
        deliveryMethod: 'email',
      },
      {
        id: 'inv-member',
        userId: 'user-2',
        email: 'two@example.com',
        resourceRole: 'viewer',
        resourceRolesJson: null,
        status: 'pending',
        expiresAt: now + 5_000,
        createdAt: 150,
        updatedAt: 250,
        revokedAt: null,
        completedAt: null,
        deliveryMethod: 'email',
      },
      {
        id: 'inv-expired',
        userId: 'user-3',
        email: 'three@example.com',
        resourceRole: 'developer',
        resourceRolesJson: null,
        status: 'pending',
        expiresAt: now - 1,
        createdAt: 120,
        updatedAt: 220,
        revokedAt: null,
        completedAt: null,
        deliveryMethod: 'manual',
      },
      {
        id: 'inv-revoked',
        userId: 'user-4',
        email: 'four@example.com',
        resourceRole: 'viewer',
        resourceRolesJson: null,
        status: 'pending',
        expiresAt: now + 10_000,
        createdAt: 130,
        updatedAt: 230,
        revokedAt: now,
        completedAt: null,
        deliveryMethod: 'email',
      },
    ]);
    projectMemberRepo.find.mockResolvedValue([{ userId: 'user-2' }]);
    userRepo.find.mockResolvedValue([
      { id: 'user-1', firstName: 'One', lastName: 'User' },
      { id: 'user-3', firstName: 'Three', lastName: null },
    ]);

    const result = await invitationQueryService.listPendingProjectInvites('project-1');

    expect(projectMemberRepo.find).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      select: ['userId'],
    });
    expect(userRepo.find).toHaveBeenCalledWith({
      where: { id: expect.anything() },
      select: ['id', 'firstName', 'lastName'],
    });
    expect(result).toEqual([
      {
        invitationId: 'inv-latest',
        userId: 'user-1',
        email: 'one@example.com',
        firstName: 'One',
        lastName: 'User',
        role: 'editor',
        roles: ['editor'],
        status: 'onboarding',
        deliveryMethod: 'email',
        expiresAt: now + 10_000,
        createdAt: 200,
      },
      {
        invitationId: 'inv-expired',
        userId: 'user-3',
        email: 'three@example.com',
        firstName: 'Three',
        lastName: null,
        role: 'developer',
        roles: ['developer'],
        status: 'expired',
        deliveryMethod: 'manual',
        expiresAt: now - 1,
        createdAt: 120,
      },
    ]);
  });

  it('fetches a project invitation by invitation id and project id', async () => {
    invitationRepo.findOne.mockResolvedValue({ id: 'inv-1' });

    const result = await invitationQueryService.getProjectInvitation('inv-1', 'project-1');

    expect(invitationRepo.findOne).toHaveBeenCalledWith({
      where: {
        id: 'inv-1',
        resourceType: 'project',
        resourceId: 'project-1',
      },
    });
    expect(result).toEqual({ id: 'inv-1' });
  });
});
