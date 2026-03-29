import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createRouteTestApp } from '../../utils/createRouteTestApp.js';

const handleConnection = vi.fn();
const createNotificationSSEManager = vi.fn(() => ({ handleConnection }));
let requireAuthImplementation = (_req: any, _res: any, next: any) => next();

vi.mock('@enterpriseglue/shared/services/notifications/index.js', () => ({
  createNotificationSSEManager,
}));

vi.mock('@enterpriseglue/shared/middleware/auth.js', () => {
  return {
    requireAuth: (req: any, res: any, next: any) => requireAuthImplementation(req, res, next),
  };
});

const { createNotificationSSEManager: createNotificationSSEManagerFactory } = await import('@enterpriseglue/shared/services/notifications/index.js');
const { createNotificationStreamRouter } = await import('../../../../packages/backend-host/src/modules/notifications/routes/stream.js');

describe('notification stream routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthImplementation = (_req, _res, next) => next();
    handleConnection.mockImplementation((_req, res) => {
      res.status(204).end();
    });
  });

  it('passes injected tenant resolver to the SSE manager factory', () => {
    const tenantResolver = {
      resolve: vi.fn(() => ({ userId: 'user-1', tenantId: 'tenant-1' })),
    };

    createNotificationSSEManagerFactory({ tenantResolver } as any);

    expect(createNotificationSSEManager).toHaveBeenCalledWith({ tenantResolver });
  });

  it('uses default factory options when no tenant resolver is provided', () => {
    createNotificationSSEManagerFactory();

    expect(createNotificationSSEManager).toHaveBeenCalledTimes(1);
  });

  it('forwards stream requests to the SSE manager handler', async () => {
    const app = createRouteTestApp(
      createNotificationStreamRouter({ handleConnection } as any)
    );

    const response = await request(app).get('/stream');

    expect(response.status).toBe(204);
    expect(handleConnection).toHaveBeenCalledTimes(1);
  });

  it('rejects unauthenticated stream requests before reaching the SSE manager', async () => {
    requireAuthImplementation = (_req, res) => {
      res.status(401).json({ error: 'Authentication required' });
    };

    const app = createRouteTestApp(
      createNotificationStreamRouter({ handleConnection } as any)
    );

    const response = await request(app).get('/stream');

    expect(response.status).toBe(401);
    expect(handleConnection).not.toHaveBeenCalled();
  });
});
