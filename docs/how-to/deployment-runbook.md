# Deployment Runbook (Docker-First)

Summary: Operational steps for running EnterpriseGlue with Docker Compose.

Audience: Developers and architects.

## Preflight
- Docker and Docker Compose installed.
- Ports available: `8787` (backend), `5173` (frontend), `5432` (postgres).
- `.env.docker` exists (copy from `.env.docker.example`).

## Start
```bash
npm run dev
```

## Verify
- Backend health: `http://localhost:8787/health`
- Frontend: `http://localhost:5173`
- Login using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.docker`.

## Logs
```bash
docker compose logs -f backend
```
```bash
docker compose logs -f frontend
```

## Stop
```bash
npm run down
```

## Reset (clean volumes)
```bash
npm run down -- -v
```

## Production-Style Local Deployment
For a host-based build and preview flow:
```bash
bash ./scripts/deploy-localhost.sh
```
Requires `backend/.env` and a frontend env file.
