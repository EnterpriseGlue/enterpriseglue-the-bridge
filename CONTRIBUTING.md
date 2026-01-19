# Contributing to EnterpriseGlue

Thanks for taking the time to contribute!

## Code of Conduct

By participating, you agree to abide by the Code of Conduct. See `CODE_OF_CONDUCT.md`.

## Ways to contribute

- Bug reports and reproduction steps
- Documentation improvements
- Bug fixes
- New features and integrations (please discuss first)

## Where to ask questions

- Use **GitHub Discussions** for questions, troubleshooting, and design discussion.
- Use **GitHub Issues** for actionable bugs and feature requests.

## Development setup

### Prerequisites

- Docker (Docker Desktop recommended)
- Docker Compose plugin (`docker compose`)

Optional (only if running services outside Docker):

- Node.js (LTS recommended)
- npm

### Configure environment

- Docker-first development uses the root `.env.docker` file.
- The Docker environment runs PostgreSQL 18 in a container and the backend uses PostgreSQL schemas for different logical databases.

### Run locally (Docker-first)

From the repo root:

- `npm run dev`

This starts:

- Backend: http://localhost:8787
- Frontend: http://localhost:5173

To stop:

- `npm run down`

Alternative entrypoints:

- `bash ./dev.sh`
- `bash ./down.sh`

### Resetting your local Docker state

If you change the Postgres major version or want to reset your local database:

- `npm run down -- -v`

### Running services outside Docker (advanced)

If you prefer to run the backend/frontend outside Docker:

- Backend:
  - Copy `backend/.env.example` to `backend/.env` and set required values.
  - `cd backend && npm install`
  - `cd backend && npm run dev`
- Frontend:
  - Copy `frontend/.env.example` to `frontend/.env.local` (or `.env`) and set required values.
  - `cd frontend && npm install`
  - `cd frontend && npm run dev`

Optional: local “production-style” run on the host (advanced):

- `npm run deploy:localhost` (or `bash ./scripts/deploy-localhost.sh`)
  - It builds `backend/dist` and `frontend/dist`, then serves the frontend via `vite preview`.

## Running checks

This repo relies on TypeScript and build-time checks.

- Backend typecheck (no emit):
  - `cd backend && npx tsc --noEmit`
- Frontend build (includes typecheck):
  - `cd frontend && npm run build`

Optional API smoke checks (requires a running backend and valid credentials):

- `./scripts/validate-api.sh`

## Pull requests

### Before opening a PR

- Keep PRs focused and small when possible.
- Add or update tests where appropriate.
- Update docs for user-visible changes.

### PR expectations

- Describe the problem and solution.
- Include steps to validate (what you ran locally).
- UI changes should include screenshots.

## Security

If you believe you have found a security vulnerability, do not open a public issue.

See `SECURITY.md` for the preferred reporting process.
