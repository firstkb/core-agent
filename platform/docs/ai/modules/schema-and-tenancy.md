# Module Memory — Schema And Tenancy

Status: active
Date: 2026-04-05

## Read this when

- adding or changing migrations
- changing master or tenant DB topology
- touching tenant resolution or tenant DB lookup
- changing bootstrap or provisioning flow
- changing schema baselines or bundle generation

## Confirmed surfaces

- `platform/backend/cmd/migrate`
- `platform/backend/internal/platform/postgres`
- `platform/backend/internal/platform/tenant`
- `platform/backend/migrations/postgres/master/**`
- `platform/backend/migrations/postgres/tenant/**`
- `platform/backend/bundle/tenant_schema_full.sql`
- `platform/backend/seeds/local/**`

## Locked invariants

- `cmd/migrate` owns schema changes
- API runtimes do not run migrations at startup
- master DB is the control-plane source of truth
- tenant databases may be sandbox/shared or dedicated
- tenant-aware tables should retain `tenant_id`
- tenant scope must come from trusted runtime context, not arbitrary request parameters
- bundle generation and forward migrations must stay coherent

## Local example topology

Documented local databases:

- `108-master`
- `108-sandbox`
- `108-demo`

Roles:

- `108-master` stores control-plane and auth-related data
- tenant DBs store tenant-scoped application data

## Important registry tables called out in docs

- `db_instance`
- `tenant_db`
- `tenant_sandbox_pool`
- `tenant_dedicated_pool`

## Important docs

- `platform/backend/docs/local-backend-bootstrap.md`
- `platform/backend/docs/backend-current-to-target-map.md`
- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/backend-schema-tenant-baseline.md`
- `platform/backend/docs/backend-schema-migrations-baseline.md`
- `platform/backend/docs/backend-schema-placement-and-naming.md`
- `platform/backend/docs/backend-db-instance-secret-resolution.md`

## High-risk rules

- do not perform ad-hoc schema edits outside the approved migration flow
- call out rollback impact for every migration change
- do not weaken tenant isolation for convenience
- do not change bundle vs forward-migration responsibilities silently

## When to update memory

Update this file when:

- migration strategy changes
- tenant topology rules change
- a new control-plane registry table becomes part of the baseline
- worker/provisioning runtime becomes real in code
