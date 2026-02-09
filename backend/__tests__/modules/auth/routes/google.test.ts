import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import googleRouter from '../../../../src/modules/auth/routes/google.js';

vi.mock('@shared/services/google.js', () => ({
  exchangeGoogleCodeForTokens: vi.fn(),
  getGoogleUserInfo: vi.fn(),
}));

vi.mock('@shared/db/data-source.js', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@shared/utils/jwt.js', () => ({
  generateAccessToken: vi.fn().mockReturnValue('access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
}));

vi.mock('@shared/services/audit.js', () => ({
  logAudit: vi.fn(),
  AuditActions: {},
}));

describe('auth google routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.disable('x-powered-by');
    app.use(express.json());
    app.use(googleRouter);
    vi.clearAllMocks();
  });

  it('placeholder test for google auth', () => {
    expect(true).toBe(true);
  });
});
