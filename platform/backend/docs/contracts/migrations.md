# Backend Migrations Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: master migrations, tenant migrations, tenant bundle, and migration runtime ownership

This contract defines the active schema source-of-truth boundary.

Read with:

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/runbooks/local-bootstrap.md`
- `platform/backend/docs/proposals/schema-drift-checks.md` only when drift verification work is activated
- `platform/backend/docs/archive/postgres-archive/README.md` only for historical PostgreSQL archaeology

## Core Invariants

- `cmd/migrate` owns schema migration execution.
- API runtimes must not run schema migrations at startup.
- Master and tenant migrations are distinct.
- Tenant bundle generation and tenant forward migrations must stay coherent.
- Archive migrations under `migrations/postgres/archive/` are not applied incrementally by the runner, but may remain bundle-generation input when rebuilding `tenant_schema_full.sql`.
- Historical SQL under `platform/backend/docs/archive/postgres-archive/` is documentation archive only and is not a migration or bundle input.

## Runtime Owner

Migration runtime:

- `platform/backend/cmd/migrate`

Migration runner:

- `platform/backend/cmd/migrate/internal/runner.go`

Migration SQL roots:

- `platform/backend/migrations/postgres/master/`
- `platform/backend/migrations/postgres/tenant/`

Tenant bundle:

- `platform/backend/bundle/tenant_schema_full.sql`

Archive:

- `platform/backend/migrations/postgres/archive/`

Historical SQL archive:

- `platform/backend/docs/archive/postgres-archive/`

## Active Master Migration Set

Master migrations currently live under:

- `platform/backend/migrations/postgres/master/*.sql`

Current active master sequence includes:

- `000_master.sql`
- `010_admin_user_phone.sql`
- `020_master_events.sql`
- `030_auth_refresh_session_family.sql`
- `040_events_principal_guid.sql`
- `050_events_guid.sql`
- `060_admin_module_registry.sql`
- `070_admin_section_grant.sql`
- `080_admin_section_rollout_alignment.sql`
- `090_admin_navigation_favorite.sql`
- `100_drop_admin_navigation_favorite.sql`
- `110_admin_employees_rollout.sql`
- `120_master_mails.sql`

The numbered sequence is the source of truth for master schema changes.

## Active Tenant Migration Set

Tenant migrations currently live under:

- `platform/backend/migrations/postgres/tenant/*.sql`

Current active tenant sequence includes:

- `000_tenant_baseline.sql`
- `001_platform_studio_static_models_seed_reference_and_logs.sql`
- `002_platform_studio_runtime_saved_filters.sql`
- `003_platform_studio_runtime_favorites.sql`
- `004_platform_studio_static_model_guid_backfill.sql`
- `005_platform_studio_static_model_users.sql`
- `006_platform_studio_static_model_company.sql`

The tenant baseline is no longer the only active tenant migration.
Forward migrations exist and must be treated as active schema history.

## Tenant Bundle Rule

The generated tenant bundle is:

- `platform/backend/bundle/tenant_schema_full.sql`

Rules:

- empty tenant DBs bootstrap from the generated bundle when that path is used
- the bundle must represent the current tenant migration set
- tenant forward migrations and bundle content must not drift
- if tenant migrations change, regenerate or verify the bundle as part of the same work

## Practical Runtime Sequence

1. Apply master migrations.
2. Bootstrap or migrate tenant DBs from the active tenant migration set.
3. Keep generated tenant bundle aligned with tenant migrations.
4. Apply future tenant incremental migrations only through `cmd/migrate`.

## Naming And Schema Policy

Use together with:

- `platform/backend/docs/contracts/schema-tenancy.md`

Accepted tenant policy:

- canonical `snake_case`
- no runtime support for legacy prefixed tenant columns
- `updated_at` and `set_updated_at()` replace legacy rowstamp behavior

## Rollback And Manual Patch Rule

- Call out rollback impact for every schema change.
- Do not patch tenant DBs manually and forget migration history.
- Do not change the tenant bundle without corresponding migration reasoning.
- Do not move archive SQL back into active history without an explicit migration decision.

## MSSQL Role

Legacy MSSQL material is migration/import reference input only.
It does not define runtime schema directly.

## Legacy PostgreSQL Archive Role

Historical PostgreSQL SQL under `platform/backend/docs/archive/postgres-archive/` is archive/reference material only.
It does not define runtime schema directly and must not be copied into active migrations without an explicit migration decision.
