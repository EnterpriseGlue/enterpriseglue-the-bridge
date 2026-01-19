import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import managementRouter from '../../../src/modules/engines/management.js';
import { getDataSource } from '../../../src/shared/db/data-source.js';

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1' };
    next();
  },
}));

vi.mock('@shared/services/platform-admin/index.js', () => ({
  engineService: {
    hasEngineAccess: vi.fn().mockResolvedValue(true),
    listEngines: vi.fn().mockResolvedValue([]),
  },
}));

describe('engines management routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(managementRouter);
    vi.clearAllMocks();

    (getDataSource as unknown as Mock).mockResolvedValue({
      getRepository: () => ({
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
      }),
    });
  });

  it('gets engine members list', async () => {
    const response = await request(app).get('/engines-api/engines/e1/members');

    expect(response.status).toBe(200);
  });

  it('gets current user role on engine', async () => {
    const response = await request(app).get('/engines-api/engines/e1/my-role');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('role');
  });

  it('gets user engines list', async () => {
    const response = await request(app).get('/engines-api/my-engines');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
