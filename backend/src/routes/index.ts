import { Express } from 'express';

// Feature Modules
import {
  projectsRoute,
  filesRoute,
  foldersRoute,
  versionsRoute,
  commentsRoute,
  deploymentsRoute,
  membersRoute,
  engineDeploymentsRoute,
} from '@modules/starbase/index.js';

import {
  missionControlRoute,
  enginesAndFiltersRoute,
  batchesRoute,
  migrationRoute,
  directRoute,
  processDefinitionsRoute,
  processInstancesRoute,
  tasksRoute,
  externalTasksRoute,
  messagesRoute,
  decisionsRoute,
  jobsRoute,
  historyExtendedRoute,
  metricsRoute,
  modifyRoute,
} from '@modules/mission-control/index.js';

import {
  enginesDeploymentsRoute,
  engineManagementRoute,
} from '@modules/engines/index.js';

import {
  gitRoute,
  gitCredentialsRoute,
  gitCreateOnlineRoute,
  gitSyncRoute,
  gitCloneRoute,
} from '@modules/git/index.js';

import {
  platformAdminRoute,
  authzRoute,
  ssoProvidersRoute,
} from '@modules/platform-admin/index.js';

import {
  loginRoute,
  logoutRoute,
  refreshRoute,
  passwordRoute,
  meRoute,
  verifyEmailRoute,
  microsoftRoute,
  signupRoute,
  forgotPasswordRoute,
  googleRoute,
  googleStartRoute,
  microsoftStartRoute,
} from '@modules/auth/index.js';

import {
  contactAdminRoute,
  emailConfigsRoute,
  emailTemplatesRoute,
  setupStatusRoute,
  tenantAdminRoute,
} from '@modules/admin/index.js';

import {
  dashboardStatsRoute,
  dashboardContextRoute,
} from '@modules/dashboard/index.js';

import { usersRoute } from '@modules/users/index.js';
import { auditRoute } from '@modules/audit/index.js';
import { notificationsRoute } from '@modules/notifications/index.js';
import invitationsRoute from '@modules/invitations/index.js';
import vcsRoute from '@modules/versioning/index.js';

/**
 * Register all application routes
 */
export function registerRoutes(app: Express): void {
  // Authentication routes
  app.use(loginRoute);
  app.use(logoutRoute);
  app.use(refreshRoute);
  app.use(passwordRoute);
  app.use(forgotPasswordRoute);
  app.use(meRoute);
  app.use(verifyEmailRoute);
  app.use(microsoftRoute);
  app.use(googleRoute);
  app.use(microsoftStartRoute);
  app.use(googleStartRoute);
  app.use(signupRoute);
  app.use(invitationsRoute);
  app.use('/api/t/:tenantSlug/admin', tenantAdminRoute);
  app.use(emailConfigsRoute);
  app.use(emailTemplatesRoute);
  app.use(setupStatusRoute);

  // User management routes
  app.use(usersRoute);

  // Audit logging routes
  app.use(auditRoute);

  // Notification routes
  app.use(notificationsRoute);

  // Dashboard routes
  app.use(dashboardStatsRoute);
  app.use(dashboardContextRoute);

  // Contact admin route (public, no auth required)
  app.use('/api/contact-admin', contactAdminRoute);

  // Starbase routes
  app.use(projectsRoute);
  app.use(filesRoute);
  app.use(foldersRoute);
  app.use(versionsRoute);
  app.use(commentsRoute);
  app.use(deploymentsRoute);
  app.use(membersRoute);
  app.use(engineDeploymentsRoute);

  // Mission Control routes
  app.use(missionControlRoute);
  app.use(enginesAndFiltersRoute);
  app.use(batchesRoute);
  app.use(migrationRoute);
  app.use(directRoute);
  app.use(processDefinitionsRoute);
  app.use(processInstancesRoute);
  app.use(tasksRoute);
  app.use(externalTasksRoute);
  app.use(messagesRoute);
  app.use(decisionsRoute);
  app.use(jobsRoute);
  app.use(historyExtendedRoute);
  app.use(metricsRoute);
  app.use(modifyRoute);

  // Engines API - deployments
  app.use(enginesDeploymentsRoute);

  // Engine Management API
  app.use(engineManagementRoute);

  // Git versioning routes
  app.use(gitRoute);
  app.use(gitCredentialsRoute);
  app.use(gitCreateOnlineRoute);
  app.use(gitSyncRoute);
  app.use(gitCloneRoute);

  // VCS routes
  app.use(vcsRoute);

  // Platform Admin API
  app.use('/api/admin', platformAdminRoute);

  // SSO Provider Management API
  app.use(ssoProvidersRoute);

  // Authorization API
  app.use(authzRoute);
}
