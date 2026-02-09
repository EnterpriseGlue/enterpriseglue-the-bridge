import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import createOnlineRouter from '../../../../src/modules/git/routes/createOnline.js';

vi.mock('@shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

vi.mock('@shared/services/git/GitService.js', () => ({
  GitService: vi.fn().mockImplementation(() => ({
    createOnlineRepository: vi.fn().mockResolvedValue({ repositoryId: 'repo-1' }),
  })),
}));

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

describe('git createOnline routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.disable('x-powered-by');
    app.use(express.json());
    app.use(createOnlineRouter);
    vi.clearAllMocks();
  });

  it('placeholder test for git createOnline', () => {
    expect(true).toBe(true);
  });
});
