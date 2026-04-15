# Backend Schema Placement And Naming

Status: accepted working decision  
Date: 2026-04-15

## Goal

Fix the live naming and placement rules for the rebuilt tenant schema and keep them aligned with the canonical tenant baseline.

## Accepted Naming Decision

### Tenant databases

Accepted target:

- tenant business tables use canonical lowercase `snake_case`
- tenant column names do not use `<table_name>_<field_name>` prefixes

Examples:

- `users.id`
- `users.email`
- `users.first_name`
- `company.company_type_id`
- `events.occurred_at`

Legacy-prefixed names remain valid only as import-source fields, not as runtime contract.

### Master database

Accepted target:

- master control-plane tables also use canonical lowercase `snake_case`

Conclusion:

- tenant and master now follow the same naming style
- the remaining difference is domain ownership, not naming policy

## Accepted GUID Decision

GUID is required in the current tenant baseline for:

- `companytype`
- `jobtype`
- `company`
- `users`
- `projects`
- `events`
- `mails`

GUID is not required in the current tenant baseline for:

- `projectsaccess`
- `state`
- `timezone`
- `public_code`
- `notification_template`

## Accepted Table Placement

### Master tables

These stay in master:

- control-plane routing, tenancy, and admin tables
- auth/session control-plane tables

Examples:

- `tenant`
- `tenant_db`
- `tenant_domain`
- `admin_user`
- `auth_refresh_token`

### Tenant tables

These stay in tenant:

- `users`
- `company`
- `companytype`
- `jobtype`
- `projects`
- `projectsaccess`
- `events`
- `mails`
- `state`
- `timezone`
- `public_code`
- `notification_template`
- `ps_model`
- `ps_view`

Reason:

- these tables are tenant-owned data or tenant runtime support surfaces

## Overlap Note

`events` and `mails` remain tenant-local canonical tables.

Before backend query refactor against the new tenant schema, admin DB overlap for those two tables must be reviewed explicitly so that reporting/projection concerns do not leak back into the tenant runtime contract.

## Practical Interpretation

Current accepted direction:

- canonical tenant runtime uses the rebuilt baseline from `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`
- canonical bundle is generated from that migration set
- legacy MSSQL structure is import-only reference material
