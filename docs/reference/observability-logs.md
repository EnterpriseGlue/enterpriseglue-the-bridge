# Observability and Logs

Summary: How to monitor health and access logs for the platform.

Audience: Developers and architects.

## Health Checks
- Backend health endpoint: `http://localhost:8787/health`

## Docker Logs
```bash
docker compose logs -f backend
```
```bash
docker compose logs -f frontend
```
```bash
docker compose logs -f db
```

## Host-Based Logs (deploy-localhost)
- Backend: `backend/server.log`
- Frontend: `frontend/preview.log`

## Startup Validation
- Backend prints configuration and database type on startup.
- Feature flags can be logged via backend configuration helpers.
