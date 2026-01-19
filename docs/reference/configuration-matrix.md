# Configuration Matrix

Summary: Required and optional environment variables for the platform.

Audience: Developers and architects.

## Backend (Minimum)
| Variable | Required | Default (Docker) | Notes |
| --- | --- | --- | --- |
| API_PORT | Yes | 8787 | Backend port |
| DATABASE_TYPE | Yes | postgres | Database engine type |
| POSTGRES_HOST | Yes | db | Docker service name |
| POSTGRES_PORT | Yes | 5432 | Postgres port |
| POSTGRES_USER | Yes | enterpriseglue | Postgres user |
| POSTGRES_PASSWORD | Yes | enterpriseglue | Postgres password |
| POSTGRES_DATABASE | Yes | enterpriseglue | Database name |
| POSTGRES_SCHEMA | Yes | main | Must be non-public |
| POSTGRES_SSL | Yes | false | Enable TLS for Postgres |
| JWT_SECRET | Yes | dev value | Must be strong in production |
| ADMIN_EMAIL | Yes | admin@enterpriseglue.ai | Bootstrap admin user |
| ADMIN_PASSWORD | Yes | dev value | Change in production |
| FRONTEND_URL | Yes | http://localhost:5173 | Frontend origin |
| ENTERPRISE_SCHEMA | No | enterprise | Must be non-public and distinct |

## Backend (Optional Integrations)
| Variable | Required | Notes |
| --- | --- | --- |
| RESEND_API_KEY | No | Email service (Resend) |
| CAMUNDA_BASE_URL | No | External Camunda engine |
| CAMUNDA_USERNAME | No | Camunda auth |
| CAMUNDA_PASSWORD | No | Camunda auth |
| MICROSOFT_CLIENT_ID | No | Microsoft Entra ID |
| MICROSOFT_CLIENT_SECRET | No | Microsoft Entra ID |
| MICROSOFT_TENANT_ID | No | Microsoft Entra ID |
| MICROSOFT_REDIRECT_URI | No | Microsoft Entra ID |
| GOOGLE_CLIENT_ID | No | Google OAuth |
| GOOGLE_CLIENT_SECRET | No | Google OAuth |
| GOOGLE_REDIRECT_URI | No | Google OAuth |

## Backend (Non-Postgres Databases)
Set `DATABASE_TYPE` and the matching variables from `backend/.env.example`:
- Oracle: `ORACLE_*`
- SQL Server: `MSSQL_*`
- Spanner: `SPANNER_*`
- MySQL: `MYSQL_*`

## Frontend
| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| VITE_API_BASE_URL | Yes | http://localhost:8787 | Backend origin |
| VITE_FEATURE_* | No | true | Feature flags per module |

## Git & Encryption
| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| GIT_REPOS_PATH | Yes | ./data/repos | Server-side git storage |
| GIT_DEFAULT_BRANCH | Yes | main | Default git branch |
| ENCRYPTION_KEY | Yes | dev value | 64-char hex key |
