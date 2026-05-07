# Backend Schema And Tenancy Contract

Status: active
Owner: backend
Last audited: 2026-05-07
Canonical scope: master schema, tenant schema, table placement, tenant isolation, and canonical naming

This contract defines the active schema and tenancy boundary.
It replaces the old split schema baseline docs as the first tracked schema read.

Read with:

- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/reference/import-field-mapping.md` only for import mapping work
- `platform/backend/docs/reference/tenant-import-boundary.md` only for future import boundary work
- `platform/backend/docs/proposals/schema-drift-checks.md` only when drift verification work is activated

## Core Invariants

- Master DB owns control-plane, routing, auth/session control, admin control, and migration coordination data.
- Tenant DBs own tenant application data and tenant runtime support data.
- Tenant-aware tables retain `tenant_id`.
- Tenant scope must come from trusted runtime context, not arbitrary request parameters.
- Master and tenant schemas use canonical lowercase `snake_case`.
- Legacy-prefixed field names are import/reference material only, not runtime schema contract.
- API runtimes must not run schema migrations at startup.

## Master Database Role

Master DB owns:

- tenant registry
- tenant domains
- tenant DB bindings
- tenant plan history
- sandbox and dedicated placement pools
- DB instance registry
- auth OTP state
- refresh token/session state
- admin users
- admin access/audit state
- master events and control-plane audit data
- migration run coordination

Master tables do not use tenant RLS.
Master tenant isolation is enforced by service logic, explicit tenant filters, and control-plane boundaries.

## Master Control Tables

Current master control-plane families include:

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
- `admin_section_grant`
- `events`
- `mails`
- `migration_runs`

Master naming stays canonical `snake_case`.
Use GUIDs only where a row is externally or session-facing; compact integer keys remain valid for internal control/history rows.

## Tenant Database Role

Tenant DBs own tenant application and tenant runtime support data.

Current canonical tenant business and reference tables:

- `state`
- `timezone`
- `industry_size`
- `industry_type`
- `companytype`
- `jobtype`
- `company`
- `users`
- `projects`
- `projectsaccess`
- `events`
- `mails`

Current tenant runtime support tables include:

- `public_code`
- `notification_template`
- `ps_model`
- `ps_view`
- `ps_navigation_config`

Current Platform Studio runtime/static-model support is extended by tenant forward migrations after the baseline.

## Tenant Naming Rules

Accepted runtime naming:

- table names stay practical and stable
- column names use lowercase ASCII `snake_case`
- no `<table_name>_<field_name>` column prefixes
- foreign keys use `<target>_id`
- booleans use explicit positive names
- mutable tenant tables use `created_at` and `updated_at`
- `updated_at` replaces legacy SQL Server `rowstamp`
- shared `set_updated_at()` handles mutable freshness where applicable

Rejected as runtime contract:

- `users_firstname`
- `projects_datebegin`
- `events_record`
- `mails_recid`
- legacy `rowstamp`
- dual legacy and canonical column layouts in runtime tables

## Tenant Isolation

Tenant-owned mutable tables remain tenant-scoped and RLS-protected where the migration contract defines RLS.

Tenant-owned mutable examples:

- `companytype`
- `jobtype`
- `company`
- `users`
- `projects`
- `projectsaccess`
- `events`
- `mails`

Global tenant reference tables in the current baseline:

- `state`
- `timezone`
- `industry_size`
- `industry_type`

`tenant_id` remains present even when a tenant has a dedicated DB, because it improves portability, operations, and future extraction options.

## GUID Policy

GUID is required in the current canonical tenant bundle for:

- `companytype`
- `jobtype`
- `company`
- `users`
- `projects`
- `events`
- `mails`
- `industry_size`
- `industry_type`

GUID is not required in the current canonical tenant bundle for:

- `projectsaccess`
- `state`
- `timezone`
- `public_code`
- `notification_template`

## Table Placement

Master tables:

- control-plane routing and tenancy tables
- auth/session control-plane tables
- admin control-plane tables
- migration coordination tables

Tenant tables:

- tenant users and profile/business records
- company/project domain tables
- tenant-local events and mails
- tenant reference tables
- tenant runtime support tables
- Platform Studio model/view/runtime support tables

`events` and `mails` can exist in both master and tenant contexts, but their use must be explicit.
Admin/reporting projection concerns must not leak back into tenant runtime ownership.

## Import Boundary

Legacy MSSQL and legacy PostgreSQL structures are import/reference sources.
They do not define the runtime schema directly.

Use import/reference docs for mapping detail:

- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`

Runtime code targets canonical PostgreSQL schema only.
