import { describe, it, expect } from 'vitest';
import {
  authzQueryKeys,
  useSsoClaimsMappings,
  useCreateSsoMapping,
  useAuthzPolicies,
  useCheckPermission,
  useAuthzAuditLog,
} from '@src/features/platform-admin/hooks/useAuthzApi';

describe('useAuthzApi', () => {
  it('exports authz query keys', () => {
    expect(authzQueryKeys.ssoMappings).toEqual(['platform-admin', 'authz', 'sso-mappings']);
    expect(authzQueryKeys.policies).toEqual(['platform-admin', 'authz', 'policies']);
    expect(authzQueryKeys.auditLog({})).toEqual(['platform-admin', 'authz', 'audit', {}]);
  });

  it('exports authz hooks', () => {
    expect(typeof useSsoClaimsMappings).toBe('function');
    expect(typeof useCreateSsoMapping).toBe('function');
    expect(typeof useAuthzPolicies).toBe('function');
    expect(typeof useCheckPermission).toBe('function');
    expect(typeof useAuthzAuditLog).toBe('function');
  });
});
