# Backend Migrations

Status: active compact backend pack
Owner surface: backend schema and migration flow
Last compacted: 2026-04-25

## Read This When

- adding migrations
- changing tenant bundle
- changing schema baselines
- changing seed/bootstrap flow

## Owner Sources

- `maestro/memory/modules/domains/schema-and-tenancy/`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/runbooks/local-bootstrap.md`
- `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- `platform/backend/cmd/migrate`
- `platform/backend/migrations/postgres/**`

## Contract

- Migrations are explicit and run through `cmd/migrate`.
- Master and tenant migrations are distinct.
- Tenant bundle and forward migrations must remain coherent.
- Active tenant migrations include `000_tenant_baseline.sql` through `007_platform_studio_navigation_builder.sql`.
- Archive old migrations only when the active migration/bundle policy permits it.
- Legacy import mapping is reference material under `platform/backend/docs/reference/`, not runtime schema truth.
- Legacy PostgreSQL SQL under `platform/backend/docs/archive/postgres-archive/**` is documentation archive only, not active migration input.

## Lessons

- Always call out rollback impact for schema changes.
- Do not patch tenant DBs manually and then forget migration history.
- Do not let local bootstrap seed behavior imply production tenant ownership rules.
