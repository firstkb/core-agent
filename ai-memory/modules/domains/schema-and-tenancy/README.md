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

- `platform/docs/ai/modules/schema-and-tenancy.md`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/local-backend-bootstrap.md`

## Fast Facts

- `cmd/migrate` owns schema changes.
- API runtimes must not run migrations at startup.
- Master DB owns control-plane and auth-related data.
- Tenant DBs own tenant-scoped application data.
- Tenant-aware tables retain `tenant_id`.
- Tenant scope must come from trusted runtime context.
- Active tenant migrations include `000_tenant_baseline.sql` through `006_platform_studio_static_model_company.sql`.
