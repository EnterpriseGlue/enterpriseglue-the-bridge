import React from 'react'
import { Navigate, RouteObject } from 'react-router-dom'

// Shared components
import LayoutWithProSidebar from '../features/shared/components/LayoutWithProSidebar'

// Starbase pages
import ProjectOverview from '../features/starbase/pages/ProjectOverview'
import ProjectDetail from '../features/starbase/pages/ProjectDetail'
import Editor from '../features/starbase/pages/Editor'

// Mission Control pages
import MissionControlBridge from '../features/mission-control/pages/MissionControlBridge'
import EnginesPage from '../features/mission-control/engines/EnginesPage'

// Mission Control components
import ProcessesOverviewPage from '../features/mission-control/processes-overview/ProcessesOverviewPage'
import ProcessInstanceDetailPage from '../features/mission-control/process-instance-detail/ProcessInstanceDetailPage'
import Decisions from '../features/mission-control/decisions-overview/components/Decisions'
import DecisionHistoryDetail from '../features/mission-control/decision-instance-detail/components/DecisionHistoryDetail'
import BatchesPage from '../features/mission-control/batches/BatchesPage'
import NewDeleteBatch from '../features/mission-control/batches/components/NewDeleteBatch'
import NewSuspendBatch from '../features/mission-control/batches/components/NewSuspendBatch'
import NewActivateBatch from '../features/mission-control/batches/components/NewActivateBatch'
import NewRetriesBatch from '../features/mission-control/batches/components/NewRetriesBatch'
import MigrationWizardPage from '../features/mission-control/migration-wizard/MigrationWizardPage'

// Platform Admin pages
import PlatformSettingsPage from '../features/platform-admin/pages/PlatformSettingsPage'
import SsoMappings from '../features/platform-admin/pages/SsoMappings'
import AuthzPolicies from '../features/platform-admin/pages/AuthzPolicies'
import AuthzAuditLog from '../features/platform-admin/pages/AuthzAuditLog'
import TenantManagement from '../features/platform-admin/pages/TenantManagement'
import TenantSetupWizard from '../features/platform-admin/pages/TenantSetupWizard'

// Guards
import { FeatureFlagGuard } from '../shared/components/FeatureFlagGuard'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'
import { RequirePasswordReset } from '../shared/components/RequirePasswordReset'

// Auth pages
import Login from '../pages/Login'
import ResetPassword from '../pages/ResetPassword'
import VerifyEmail from '../pages/VerifyEmail'
import Signup from '../pages/Signup'
import AcceptInvite from '../pages/AcceptInvite'

// Admin pages
import AuditLogViewer from '../pages/AuditLogViewer'
import UserManagement from '../pages/admin/UserManagement'
import TenantUsers from '../pages/admin/TenantUsers'
import TenantSettings from '../pages/admin/TenantSettings'
import EmailConfigurations from '../pages/admin/EmailConfigurations'
import EmailTemplates from '../pages/admin/EmailTemplates'
import Branding from '../pages/admin/Branding'

// Dashboard
import Dashboard from '../pages/Dashboard'

// Git OAuth
import OAuthCallback from '../features/git/pages/OAuthCallback'

// Settings
import GitConnections from '../pages/settings/GitConnections'

/**
 * Creates protected child routes that are shared between root (/) and tenant (/t/:tenantSlug) layouts
 * @param isRootLevel - true for root routes (uses "/" prefix), false for tenant routes (no prefix)
 */
export function createProtectedChildRoutes(isRootLevel: boolean): RouteObject[] {
  const fallbackPath = isRootLevel ? '/' : '..'
  const pathPrefix = isRootLevel ? '/' : ''

  return [
    { index: true, element: <Dashboard /> },
    
    // Admin routes
    { 
      path: `${pathPrefix}admin/settings`, 
      element: (
        <ProtectedRoute requireAdmin={isRootLevel}>
          {isRootLevel ? <PlatformSettingsPage /> : <TenantSettings />}
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/sso-mappings`, 
      element: (
        <ProtectedRoute requireAdmin>
          <SsoMappings />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/policies`, 
      element: (
        <ProtectedRoute requireAdmin>
          <AuthzPolicies />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/authz-audit`, 
      element: (
        <ProtectedRoute requireAdmin>
          <AuthzAuditLog />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/tenants`, 
      element: (
        <ProtectedRoute requireAdmin>
          <TenantManagement />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/audit-logs`, 
      element: (
        <ProtectedRoute requireAdmin={isRootLevel}>
          <AuditLogViewer />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/email`, 
      element: (
        <ProtectedRoute requireAdmin>
          <EmailConfigurations />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/email-templates`, 
      element: (
        <ProtectedRoute requireAdmin>
          <EmailTemplates />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/branding`, 
      element: (
        <ProtectedRoute requireAdmin>
          <Branding />
        </ProtectedRoute>
      )
    },
    { 
      path: `${pathPrefix}admin/users`, 
      element: (
        <ProtectedRoute requireAdmin={isRootLevel}>
          {isRootLevel ? <UserManagement /> : <TenantUsers />}
        </ProtectedRoute>
      )
    },

    // Setup
    { 
      path: `${pathPrefix}setup`, 
      element: (
        <ProtectedRoute>
          <TenantSetupWizard />
        </ProtectedRoute>
      )
    },

    // Starbase routes
    { 
      path: `${pathPrefix}starbase`, 
      element: (
        <FeatureFlagGuard flag="starbase" fallback={<Navigate to={fallbackPath} replace />}>
          <ProjectOverview />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}starbase/*`, 
      element: (
        <FeatureFlagGuard flag="starbase" fallback={<Navigate to={fallbackPath} replace />}>
          <ProjectOverview />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}starbase/project/:projectId`, 
      element: (
        <FeatureFlagGuard flag="starbase" fallback={<Navigate to={fallbackPath} replace />}>
          <ProjectDetail />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}starbase/editor/:fileId`, 
      element: (
        <FeatureFlagGuard flag="starbase" fallback={<Navigate to={fallbackPath} replace />}>
          <Editor />
        </FeatureFlagGuard>
      )
    },

    // Mission Control routes
    { 
      path: `${pathPrefix}mission-control`, 
      element: (
        <FeatureFlagGuard flag="missionControl" fallback={<Navigate to={fallbackPath} replace />}>
          <MissionControlBridge />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/processes`, 
      element: (
        <FeatureFlagGuard flag="missionControl.processes" fallback={<Navigate to={fallbackPath} replace />}>
          <ProcessesOverviewPage />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/processes/instances/:instanceId`, 
      element: (
        <FeatureFlagGuard flag="missionControl.processes" fallback={<Navigate to={fallbackPath} replace />}>
          <ProcessInstanceDetailPage />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/batches`, 
      element: (
        <FeatureFlagGuard flag="missionControl.batches" fallback={<Navigate to={fallbackPath} replace />}>
          <BatchesPage />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/batches/:batchId`, 
      element: (
        <FeatureFlagGuard flag="missionControl.batches" fallback={<Navigate to={fallbackPath} replace />}>
          <BatchesPage />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/batches/new/delete`, 
      element: (
        <FeatureFlagGuard flag="missionControl.batches" fallback={<Navigate to={fallbackPath} replace />}>
          <NewDeleteBatch />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/batches/new/suspend`, 
      element: (
        <FeatureFlagGuard flag="missionControl.batches" fallback={<Navigate to={fallbackPath} replace />}>
          <NewSuspendBatch />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/batches/new/activate`, 
      element: (
        <FeatureFlagGuard flag="missionControl.batches" fallback={<Navigate to={fallbackPath} replace />}>
          <NewActivateBatch />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/batches/new/retries`, 
      element: (
        <FeatureFlagGuard flag="missionControl.batches" fallback={<Navigate to={fallbackPath} replace />}>
          <NewRetriesBatch />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/migration/new`, 
      element: (
        <FeatureFlagGuard flag="missionControl" fallback={<Navigate to={fallbackPath} replace />}>
          <MigrationWizardPage />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/decisions`, 
      element: (
        <FeatureFlagGuard flag="missionControl.decisions" fallback={<Navigate to={fallbackPath} replace />}>
          <Decisions />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/decisions/instances/:id`, 
      element: (
        <FeatureFlagGuard flag="missionControl.decisions" fallback={<Navigate to={fallbackPath} replace />}>
          <DecisionHistoryDetail />
        </FeatureFlagGuard>
      )
    },
    { 
      path: `${pathPrefix}mission-control/*`, 
      element: (
        <FeatureFlagGuard flag="missionControl" fallback={<Navigate to={fallbackPath} replace />}>
          <MissionControlBridge />
        </FeatureFlagGuard>
      )
    },

    // Engines
    { 
      path: `${pathPrefix}engines`, 
      element: (
        <FeatureFlagGuard flag="engines" fallback={<Navigate to={fallbackPath} replace />}>
          <EnginesPage />
        </FeatureFlagGuard>
      )
    },

    // Settings
    { path: `${pathPrefix}profile`, element: <Navigate to={fallbackPath} replace /> },
    { path: `${pathPrefix}settings/git-connections`, element: <GitConnections /> },

    // Legacy redirects
    { path: `${pathPrefix}tower/*`, element: <Navigate to={isRootLevel ? '/mission-control/processes' : '../mission-control/processes'} replace /> },
    { path: `${pathPrefix}tower`, element: <Navigate to={isRootLevel ? '/mission-control/processes' : '../mission-control/processes'} replace /> },
  ]
}

/**
 * Public routes that don't require authentication
 */
export function getPublicRoutes(): RouteObject[] {
  return [
    { path: '/login', element: <Login /> },
    { path: '/t/:tenantSlug/login', element: <Login /> },
    { path: '/verify-email', element: <VerifyEmail /> },
    { path: '/t/:tenantSlug/verify-email', element: <VerifyEmail /> },
    { path: '/signup', element: <Signup /> },
    { 
      path: '/git/oauth/callback', 
      element: (
        <ProtectedRoute>
          <OAuthCallback />
        </ProtectedRoute>
      )
    },
    { 
      path: '/reset-password', 
      element: (
        <ProtectedRoute>
          <ResetPassword />
        </ProtectedRoute>
      )
    },
    { 
      path: '/t/:tenantSlug/reset-password', 
      element: (
        <ProtectedRoute>
          <ResetPassword />
        </ProtectedRoute>
      )
    },
  ]
}

/**
 * Creates the root protected layout route
 */
export function createRootLayoutRoute(enterpriseChildren: RouteObject[] = []): RouteObject {
  return {
    path: '/',
    element: (
      <ProtectedRoute>
        <RequirePasswordReset>
          <LayoutWithProSidebar />
        </RequirePasswordReset>
      </ProtectedRoute>
    ),
    children: [...createProtectedChildRoutes(true), ...enterpriseChildren],
  }
}

/**
 * Creates the tenant protected layout route
 */
export function createTenantLayoutRoute(enterpriseChildren: RouteObject[] = []): RouteObject {
  return {
    path: '/t/:tenantSlug',
    element: (
      <ProtectedRoute>
        <RequirePasswordReset>
          <LayoutWithProSidebar />
        </RequirePasswordReset>
      </ProtectedRoute>
    ),
    children: [
      ...createProtectedChildRoutes(false),
      { path: 'invite/:token', element: <AcceptInvite /> },
      ...enterpriseChildren,
    ],
  }
}

/**
 * Creates all application routes
 */
export function createAppRoutes(
  enterpriseRootChildren: RouteObject[] = [],
  enterpriseTenantChildren: RouteObject[] = []
): RouteObject[] {
  return [
    ...getPublicRoutes(),
    createRootLayoutRoute(enterpriseRootChildren),
    createTenantLayoutRoute(enterpriseTenantChildren),
  ]
}
