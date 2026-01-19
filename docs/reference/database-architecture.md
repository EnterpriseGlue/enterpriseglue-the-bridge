# Database Architecture Overview

Summary: How EnterpriseGlue models data, schemas, and database adapters.

Audience: Developers and architects.

## Database Model
- **ORM**: TypeORM (entities and repositories).
- **Schemas**: A primary schema (`main`) and an enterprise schema (`enterprise`).
- **Entities**: Core product data lives in the main schema.

## Supported Databases
Configured via `DATABASE_TYPE`:
- `postgres` (default)
- `oracle`
- `mssql`
- `spanner`
- `mysql`

## Schema Rules
- `POSTGRES_SCHEMA` must be **non-public**.
- `ENTERPRISE_SCHEMA` must be **non-public** and distinct from `POSTGRES_SCHEMA`.

## Migrations
- Migrations run automatically on backend startup.
- TypeORM migrations are generated from entity changes.

## Adapter Layer
Database-specific adapters live under `backend/src/shared/db/adapters`.

## Related Docs
- `backend/src/shared/db/README.md`
- `backend/docs/DATABASE-MIGRATIONS.md`
