import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import membersRouter from '../../../../src/modules/starbase/routes/members.js';
import { getDataSource } from '../../../../src/shared/db/data-source.js';
import { ProjectMember } from '../../../../src/shared/db/entities/ProjectMember.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

vi.mock('@shared/middleware/projectAuth.js', () => ({
  requireProjectRole: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@shared/services/platform-admin/ProjectMemberService.js', () => ({
  projectMemberService: {
    listProjectMembers: vi.fn().mockResolvedValue([]),
    addProjectMember: vi.fn().mockResolvedValue({ id: 'pm1', userId: 'u1', role: 'editor' }),
    updateProjectMemberRole: vi.fn().mockResolvedValue({ id: 'pm1', role: 'viewer' }),
    removeProjectMember: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('starbase members routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(membersRouter);
    vi.clearAllMocks();

    const memberRepo = {
      find: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue({ id: 'pm1', userId: 'u1', role: 'editor' }),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: (entity: unknown) => {
        if (entity === ProjectMember) return memberRepo;
        return { find: vi.fn().mockResolvedValue([]), save: vi.fn(), delete: vi.fn() };
      },
    });
  });

  it('placeholder test for members routes', () => {
    expect(true).toBe(true);
  });
});
