# Backend Schema Placement And Naming

Status: accepted working decision  
Date: 2026-03-30

## Goal

Fix two decisions before final migration cleanup:

- which tables live in `master` and which live in `tenant`
- whether tenant and master use the same naming style

## Accepted Naming Decision

## Tenant databases

Accepted target:

- tenant business tables should use legacy-compatible prefixed column naming
- pattern: `<table_name>_<field_name>`

Examples:

- `users_id`
- `users_email`
- `company_id`
- `projects_name`
- `events_date`

Reason:

- simplifies mapping from legacy MSSQL
- reduces ambiguity during ETL and bulk import
- makes old-to-new column mapping more explicit for agents and migration scripts

Important:

- this is the target tenant naming policy
- the current bootstrap tenant bundle now applies this policy to `users`
- other tenant tables are still in transition until the remaining legacy-shaped rebuild is finished

## Master database

Accepted target:

- master control-plane tables keep modern snake_case naming
- pattern: short table names and short field names

Examples:

- `tenant.id`
- `tenant_db.db_name`
- `tenant_domain.host`
- `auth_refresh_token.token_hash`

Reason:

- master is not a direct legacy-table port
- master is a new control-plane model
- compact naming is clearer for runtime code, joins, and admin logic
- AI agents read and reason about control-plane tables more easily with shorter normalized names

Conclusion:

- tenant naming and master naming do not have to match
- tenant can optimize for migration compatibility
- master can optimize for clarity and control-plane correctness

## Accepted GUID Decision

Accepted target:

- GUID is required for externally referenced business entities
- GUID is not required for every history, link, or control-plane row
- the working pattern is dual-key:
  - internal relational/business key stays `bigint`
  - external/API-facing identity key is `uuid`

Important:

- GUID is not treated as the only security boundary
- authorization and tenant filtering remain mandatory
- GUID is mainly for stable external identity, safer references, and migration/integration correctness

Tenant starter entities that must have GUID:

- `users`
- `company`
- `companytype`
- `projects`

Tenant starter entities that do not need GUID in the first baseline:

- `projectsaccess`
- `events`
- `mails`

Master starter entities that should be GUID-addressable:

- `tenant`
- `admin_user`
- `auth_otp`
- `auth_refresh_token`

Master control/history rows that do not need GUID in the first baseline:

- `db_instance`
- `tenant_domain`
- `tenant_db`
- `tenant_plan_history`
- `tenant_sandbox_pool`
- `tenant_dedicated_pool`
- `migration_runs`
- `tenant_auth_policy`
- `admin_tenant_access_audit`

## Accepted Table Placement

## Master tables

These belong in master and should stay there:

- `schema_migrations`
- `migration_runs`
- `db_instance`
- `tenant`
- `tenant_domain`
- `tenant_db`
- `tenant_plan_history`
- `tenant_sandbox_pool`
- `tenant_dedicated_pool`
- `tenant_auth_policy`
- `auth_otp`
- `auth_refresh_token`
- `admin_user`
- `admin_tenant_access_audit`

Why these stay in master:

- they control routing, placement, auth state, or platform administration
- they are cross-tenant or control-plane concerns
- they should not be duplicated into every tenant DB

## Tenant tables

These belong in tenant DBs and should stay there:

- `schema_migrations`
- `contacts`
- `users`
- `public_code`
- `notification_template`
- `events`

Why these stay in tenant DB:

- they are tenant data
- they must move with tenant isolation rules
- they are part of the data boundary that sandbox and dedicated DB modes are trying to preserve

## Legacy MSSQL placement mapping

From the currently provided MSSQL files:

- `users.sql` -> tenant DB
- `company.sql` -> tenant DB
- `companytype.sql` -> tenant DB
- `projects.sql` -> tenant DB
- `projectsaccess.sql` -> tenant DB
- `events.sql` -> tenant DB
- `mails.sql` -> tenant DB

Reason:

- these are tenant business or tenant activity tables
- even if some fields later move into master read models or admin views, the data ownership remains tenant-local

## Starter table set to freeze first

## Master starter set

This should be treated as the first stable master baseline:

- `schema_migrations`
- `migration_runs`
- `db_instance`
- `tenant`
- `tenant_domain`
- `tenant_db`
- `tenant_plan_history`
- `tenant_sandbox_pool`
- `tenant_dedicated_pool`
- `tenant_auth_policy`
- `auth_otp`
- `auth_refresh_token`
- `admin_user`
- `admin_tenant_access_audit`

Likely next master technical additions:

- none required for the current auth/control baseline

## Tenant starter set

This should be treated as the first stable tenant baseline scope:

- `schema_migrations`
- `users`
- `company`
- `companytype`
- `projects`
- `projectsaccess`
- `events`
- `mails`
- `public_code`
- `notification_template`

Notes:

- `contacts` should now be treated as transitional, not as a final starter-table requirement
- if `contacts` remains at all, it should be justified as a derived or convenience surface over tenant user/business data
- `events` is the single canonical tenant event table
- `events` should use quarterly partitioning on `events_created_at`
- current `users` now follows the full legacy-shaped baseline from `docs/MSSQL/users.sql`
- starter tenant business entities should follow dual-key design:
  - `*_id bigint` for legacy/business joins
  - `*_guid uuid` for API/integration identity

## Practical interpretation

Current state:

- master baseline is close to its final shape
- tenant baseline is still transitional

Therefore:

- do not assume the current tenant bundle is final just because it runs
- the next real schema-design stage should focus on tenant tables first
- after tenant table decisions are accepted, rebuild the tenant bundle from our own approved migrations and remove legacy noise

## Next cleanup step

1. Approve naming policy:
   - tenant = legacy-compatible prefixed columns
   - master = modern snake_case
2. Approve starter table placement.
3. For each tenant starter table, create a field-level target document from `docs/MSSQL`.
4. Rebuild `tenant_schema_full.sql` from approved tenant-first migrations.
5. Wipe and recreate local DBs if needed after the new bundle and master baseline are accepted.
