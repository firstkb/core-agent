# Backend Migrations Baseline

Status: accepted working baseline  
Date: 2026-04-15

## Goal

Fix the live schema source-of-truth boundary for:

- master schema
- tenant canonical baseline
- future tenant incremental migrations

## Accepted Artifacts

Master baseline:

- `platform/backend/migrations/postgres/master/*.sql`

Tenant baseline:

- `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`
- generated bundle: `platform/backend/bundle/tenant_schema_full.sql`

Tenant forward migrations:

- future `.sql` files under `platform/backend/migrations/postgres/tenant/`
- none are active yet beyond the canonical baseline

Archive surface:

- `platform/backend/migrations/postgres/archive/`

## Current Tenant State

The active tenant migration set is intentionally minimal:

- `000_tenant_baseline.sql`

Meaning:

- empty tenant DBs bootstrap from the generated bundle
- the bundle is generated from the current tenant migration set
- old folded no-op tenant migrations were removed to keep the baseline clean

## Naming And Schema Policy

Use together with:

- `backend-schema-placement-and-naming.md`
- `backend-schema-tenant-baseline.md`
- `backend-tenant-canonical-refactor-contract-v1.md`

Current accepted tenant policy:

- canonical `snake_case`
- no runtime support for legacy prefixed tenant columns
- `updated_at + set_updated_at()` replaces legacy rowstamp behavior

## Practical Runtime Sequence

1. apply master migrations
2. bootstrap empty tenant DBs from `bundle/tenant_schema_full.sql`
3. later, apply new tenant incremental migrations only when they exist

## MSSQL Role

`platform/backend/docs/MSSQL/*` is migration reference input only.

It does not define the runtime schema directly.
