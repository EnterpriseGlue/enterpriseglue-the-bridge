# Non-Postgres Database Setup

Summary: Configure EnterpriseGlue with Oracle, SQL Server, Spanner, or MySQL.

Audience: Developers and architects.

## General Steps
1. Set `DATABASE_TYPE` in `backend/.env`.
2. Fill in the database-specific env vars.
3. Install the required driver package.
4. Start the backend and confirm the database type in logs.

## Oracle
- Env vars: `ORACLE_HOST`, `ORACLE_PORT`, `ORACLE_USER`, `ORACLE_PASSWORD`,
  `ORACLE_SERVICE_NAME` (or `ORACLE_SID`), `ORACLE_SCHEMA`.
- Driver: `oracledb` (requires Oracle Instant Client).

## SQL Server
- Env vars: `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USER`, `MSSQL_PASSWORD`,
  `MSSQL_DATABASE`, `MSSQL_SCHEMA`, `MSSQL_ENCRYPT`, `MSSQL_TRUST_SERVER_CERTIFICATE`.
- Driver: `mssql`.

## Google Spanner
- Env vars: `SPANNER_PROJECT_ID`, `SPANNER_INSTANCE_ID`, `SPANNER_DATABASE_ID`.
- Driver: `@google-cloud/spanner`.
- Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path.

## MySQL
- Env vars: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`,
  `MYSQL_DATABASE`.
- Driver: `mysql2`.

## Verify
- Backend logs print the active database type on startup.
- Confirm schema settings are non-public and distinct.

## Reference
See `backend/.env.example` for all supported variables.
