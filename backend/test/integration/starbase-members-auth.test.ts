import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';

const app = createApp({
  includeTenantContext: false,
  includeRateLimiting: false,
});

describe('Starbase members auth', () => {
  it('rejects unauthenticated members list', async () => {
    const response = await request(app)
      .get('/starbase-api/projects/00000000-0000-0000-0000-000000000000/members');

    expect(response.status).toBe(401);
  });
});
