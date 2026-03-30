# Backend Migrations Baseline

Status: accepted working baseline  
Date: 2026-03-30

## Goal

Fix the backend schema source-of-truth boundary for:

- master schema
- tenant bootstrap schema
- tenant incremental migrations
- legacy MSSQL mapping reference

## Accepted Naming

Current accepted artifact names:

- tenant starter bundle: `bundle/tenant_schema_full.sql`
- master baseline SQL: `migrations/postgres/master/000_master.sql`
- tenant forward migrations: `migrations/postgres/tenant`
- tenant folded-into-bundle archive: `migrations/postgres/archive`

Important:

- `migrations/postgres/tenant` is now the active forward tenant migration path
- `migrations/postgres/archive` remains as the active archive surface for tenant migrations already folded into the current full tenant bundle
- `bundle/tenant_schema_full.sql` must be generated from `migrations/postgres/archive` plus `migrations/postgres/tenant`
- `docs/legacy/postgres-archive` is no longer part of the active runtime contract

## Accepted Database Naming Policy

Tenant database target:

- tenant business tables should move toward legacy-compatible prefixed column naming
- preferred pattern: `<table_name>_<field_name>`
- this is accepted to simplify data migration from legacy MSSQL and make field mapping explicit

Master database target:

- master control-plane tables should keep modern snake_case naming
- preferred pattern: compact table names with compact column names such as `tenant.id`, `tenant_db.db_name`
- reason: master is a new control-plane model, not a direct legacy-table port

Exceptions:

- `schema_migrations` stays standard in both master and tenant DBs
- PostgreSQL internal or extension-owned objects keep standard naming

Consequence:

- the current `tenant_schema_full.sql` is a technical bootstrap baseline, but not yet the final tenant naming baseline
- before final schema freeze, the tenant bundle should be regenerated from approved tenant-first migrations that follow the accepted tenant naming policy

## Current Master Baseline

The active master baseline is defined by:

- `000_master.sql`

This is the accepted current master schema baseline.

## Current Tenant Bootstrap Set

The current first full tenant baseline is packed into:

- `bundle/tenant_schema_full.sql`

The bundle should now be generated from:

- `migrations/postgres/archive`
- `migrations/postgres/tenant`

This is the accepted current first full tenant baseline.

## Current Incremental Tenant Migration Set

The current incremental tenant path is:

- `migrations/postgres/tenant`

Current state:

- no new incremental tenant migrations are active there yet

Interpretation:

- the runtime is currently in a baseline-first state
- future tenant schema changes should land as new incremental migrations after the target table shapes are accepted

## Runtime Ownership Rules

Master source of truth:

- `migrations/postgres/master/*.sql`

Tenant source of truth:

- bootstrap baseline: `bundle/tenant_schema_full.sql`
- forward changes: `migrations/postgres/tenant/*.sql`

Archive status:

- `migrations/postgres/archive` is the future active archive surface for tenant migrations already included in the full tenant build
- `docs/legacy/postgres-archive` is historical source material
- it is not the runtime contract by itself
- it must not be used as the active bundle input anymore

## Practical Consequence

Today the backend runtime should be understood as:

1. apply master migrations
2. bootstrap empty tenant DBs from `bundle/tenant_schema_full.sql`
3. apply incremental tenant migrations from `migrations/postgres/tenant`

For architecture review and clean-start inspection, the tenant starter file is:

1. `bundle/tenant_schema_full.sql`

## MSSQL Migration Mapping Policy

The provided MSSQL dump files are reference inputs, not direct DDL to port line-by-line.

Accepted approach:

- preserve business meaning where still relevant
- simplify legacy wide tables into clearer PostgreSQL models
- prefer structured JSON or separate domain tables over extremely wide audit tables
- keep tenant isolation explicit in every tenant-facing table decision

Primary reference files currently used:

- `docs/MSSQL/users.sql`
- `docs/MSSQL/company.sql`
- `docs/MSSQL/companytype.sql`
- `docs/MSSQL/projects.sql`
- `docs/MSSQL/projectsaccess.sql`
- `docs/MSSQL/events.sql`
- `docs/MSSQL/mails.sql`

## Current Finalization Decisions

Already fixed:

- control-plane routing and placement stay in master
- auth OTP and refresh tokens stay in master
- tenant event logging stays in tenant DB
- tenant templates stay in tenant DB
- tenant bundle is named `tenant_schema_full.sql`
- the tenant bundle remains the first full build artifact

Still to finalize explicitly:

- future canonical replacement for wide legacy `company`
- future canonical replacement for wide legacy `projects`
- future canonical replacement for wide legacy `projectsaccess`
- future canonical expansion of tenant `users`
- whether `public_code` and `notification_template` should gain RLS

## Recommended Cleanup Sequence

1. Review and approve the table baselines in:
   - `docs/backend-schema-tenant-baseline.md`
   - `docs/backend-schema-master-baseline.md`
2. Decide which legacy MSSQL columns must survive into the first business-domain migrations.
3. Create new incremental tenant migrations only after field-level approval.
4. If needed, wipe local example DBs and rebuild from:
   - `migrations/postgres/master/000_master.sql`
   - `bundle/tenant_schema_full.sql`
   - approved seeds
5. Move future tenant migrations into `migrations/postgres/archive` only after they are already folded into the rebuilt `tenant_schema_full.sql`.
