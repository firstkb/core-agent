# Schema And Tenancy Contract

Status: active compact contract

## Invariants

- Schema changes go through migrations owned by `cmd/migrate`.
- API runtimes do not run schema migrations at startup.
- Master DB is the control-plane source of truth.
- Tenant DBs may be sandbox/shared or dedicated.
- Tenant-aware tables retain `tenant_id`.
- Tenant scope must not come from arbitrary request parameters.
- Bundle generation and forward migrations must stay coherent.
- Active tenant forward migrations exist beyond the tenant baseline; do not treat `000_tenant_baseline.sql` as the only active tenant migration.

## Current Local Topology

- `108-master`: control-plane and auth-related data.
- `108-sandbox`: tenant DB.
- `108-demo`: tenant DB.

## Important Registry Tables

- `db_instance`
- `tenant_db`
- `tenant_sandbox_pool`
- `tenant_dedicated_pool`

## Current Surfaces

- `platform/backend/cmd/migrate`
- `platform/backend/internal/platform/postgres`
- `platform/backend/internal/platform/tenant`
- `platform/backend/migrations/postgres/master/**`
- `platform/backend/migrations/postgres/tenant/**`
- `platform/backend/bundle/tenant_schema_full.sql`
- `platform/backend/seeds/local/**`
