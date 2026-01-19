# Feature Flags Reference

Summary: Environment-driven feature flags for backend and frontend modules.

Audience: Developers and architects.

## Backend Feature Flags
Configured via environment variables:

| Flag | Env Var | Description |
| --- | --- | --- |
| projectCollaboration | PROJECT_COLLAB_ENABLED | Project collaboration features |
| engineOwnership | ENGINE_OWNERSHIP_ENABLED | Engine ownership features |
| environmentTags | ENV_TAGS_ENABLED | Environment tags |
| contextAwareAuth | CONTEXT_AUTH_ENABLED | Context-aware authorization |
| platformAdminUI | PLATFORM_ADMIN_ENABLED | Platform admin UI features |
| impersonation | IMPERSONATION_ENABLED | Dev-only impersonation (never prod) |

## Frontend Feature Flags
Configured via `VITE_FEATURE_*`:
- `VITE_FEATURE_VOYAGER`
- `VITE_FEATURE_STARBASE`
- `VITE_FEATURE_MISSION_CONTROL`
- `VITE_FEATURE_ENGINES`
- `VITE_FEATURE_MC_PROCESSES`
- `VITE_FEATURE_MC_BATCHES`
- `VITE_FEATURE_MC_DECISIONS`
- `VITE_FEATURE_SB_PROJECTS`
- `VITE_FEATURE_SB_FILES`
- `VITE_FEATURE_NOTIFICATIONS`
- `VITE_FEATURE_USER_MENU`

## Notes
- Flags are evaluated at startup (backend) and build/runtime (frontend).
- Do not enable `IMPERSONATION_ENABLED` in production.
