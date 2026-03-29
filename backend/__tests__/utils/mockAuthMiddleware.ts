import type { RequestHandler } from 'express';
import type { TenantContext } from '@enterpriseglue/shared/middleware/tenant.js';
import type { JwtPayload } from '@enterpriseglue/shared/utils/jwt.js';

type MockUser = Partial<JwtPayload>;
type MockTenant = Partial<TenantContext> | { tenantId: null } | null;
type MockOnboarding = Partial<JwtPayload>;

interface MockAuthOptions {
  onboarding?: MockOnboarding;
  tenant?: MockTenant;
  user?: MockUser;
}

const defaultUser: JwtPayload = {
  userId: 'user-1',
  email: 'user@example.com',
  platformRole: 'user',
  type: 'access',
};

const defaultOnboarding: JwtPayload = {
  userId: 'user-1',
  email: 'user@example.com',
  platformRole: 'user',
  type: 'onboarding',
};

function buildOnboardingPayload(overrides: MockOnboarding = {}): JwtPayload {
  return { ...defaultOnboarding, ...overrides } as JwtPayload;
}

export function createRequireAuthMiddleware(options: MockAuthOptions = {}): RequestHandler {
  return (req, _res, next) => {
    req.user = { ...defaultUser, ...(options.user ?? {}) } as JwtPayload;

    if ('tenant' in options) {
      (req as any).tenant = options.tenant;
    }

    if ('onboarding' in options) {
      req.onboarding = buildOnboardingPayload(options.onboarding);
    }

    next();
  };
}

export function createRequireOnboardingMiddleware(onboarding: MockOnboarding = {}): RequestHandler {
  return (req, _res, next) => {
    req.onboarding = buildOnboardingPayload(onboarding);
    next();
  };
}
