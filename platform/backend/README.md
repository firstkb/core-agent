# Platform Backend

Go backend for the platform modular monolith.

Active runtimes:

- `cmd/auth`
- `cmd/api-admin`
- `cmd/api-tenant`
- `cmd/migrate`

Key local-development surfaces:

- env templates: `env/*.env.example`
- local runbook: `docs/local-backend-bootstrap.md`
- local seeds: `seeds/local/*.sql`
- changelog: `CHANGELOG.md`

Runtime mode:

- use `*_RUNTIME_ENVIRONMENT=dev` for local development
- `auth` in `dev` uses debug notify and a fixed OTP from `AUTHAPI_AUTH_DEV_FIXEDOTP`
- `prod` must not rely on debug/fixed-OTP behavior

Migration model:

- tenant starter bundle: `bundle/tenant_schema_full.sql`
- master baseline SQL source: `migrations/postgres/master/000_master.sql`
- tenant forward SQL source: `migrations/postgres/tenant`
- tenant folded-into-bundle archive: `migrations/postgres/archive`
