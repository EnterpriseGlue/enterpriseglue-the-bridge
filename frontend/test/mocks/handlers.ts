import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/sso/providers/enabled', () => {
    return HttpResponse.json([
      { id: 'sso-1', name: 'Google', type: 'google' },
    ]);
  }),
  http.get('/api/auth/branding', () => {
    return HttpResponse.json({});
  }),
  http.get('/api/auth/platform-settings', () => {
    return HttpResponse.json({
      syncPushEnabled: true,
      syncPullEnabled: false,
      syncBothEnabled: false,
      gitProjectTokenSharingEnabled: false,
      defaultDeployRoles: [],
    });
  }),
  http.get('/starbase-api/projects', () => {
    return HttpResponse.json([
      {
        id: 'project-1',
        name: 'Alpha Project',
        createdAt: Date.now(),
        foldersCount: 0,
        filesCount: 0,
        gitUrl: null,
        gitProviderType: null,
        gitSyncStatus: null,
        members: [],
      },
    ]);
  }),
  http.get('/vcs-api/projects/uncommitted-status', () => {
    return HttpResponse.json({ statuses: {} });
  }),
  http.get('/git-api/providers', () => {
    return HttpResponse.json([]);
  }),
  http.get('/git-api/credentials', () => {
    return HttpResponse.json([]);
  }),
  http.post('/api/notifications', async () => {
    return HttpResponse.json({ ok: true });
  }),
];
