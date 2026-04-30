# Schema And Tenancy

Status: active compact module pack
Owner surface: schema and tenancy product domain, backend/platform
Last compacted: 2026-04-25

## Read This When

- adding or changing migrations
- changing master or tenant DB topology
- touching tenant resolution or tenant DB lookup
- changing schema baselines, bundle generation, or local bootstrap

## Owner Sources

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/runbooks/local-bootstrap.md`
- `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`

Historical import context lives in `maestro/memory/durable/legacy-memory-import.md`; the old `platform/docs/ai/**` path has been deleted.

## Fast Facts

- `cmd/migrate` owns schema changes.
- API runtimes must not run migrations at startup.
- Master DB owns control-plane and auth-related data.
- Tenant DBs own tenant-scoped application data.
- Tenant-aware tables retain `tenant_id`.
- Tenant scope must come from trusted runtime context.
- Active tenant migrations include `000_tenant_baseline.sql` through `006_platform_studio_static_model_company.sql`.
- Legacy MSSQL/PostgreSQL import mapping is reference material, not runtime schema truth.
- Legacy PostgreSQL SQL lives under `platform/backend/docs/archive/postgres-archive/**` and should be opened only for explicit archaeology.
