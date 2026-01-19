# Troubleshooting

Summary: Common issues and fixes for EnterpriseGlue setup.

Audience: Developers and architects.

## Backend fails to start (missing env)
- Ensure `.env.docker` (Docker) or `backend/.env` (host) exists.
- Check required variables: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Schema validation errors
- `POSTGRES_SCHEMA` must not be `public`.
- `ENTERPRISE_SCHEMA` must be distinct from `POSTGRES_SCHEMA`.

## Database connection errors
- Confirm `POSTGRES_HOST` and credentials.
- Ensure the `db` container is healthy in Docker.

## Frontend cannot reach API
- Verify `VITE_API_BASE_URL`.
- Confirm backend is running on `http://localhost:8787`.

## Docker compose ports in use
- Stop conflicting services on ports 8787/5173/5432.
- Or change ports in `.env.docker`.

## Migrations fail
- Verify database credentials and schema permissions.
- Check backend logs for migration errors.
