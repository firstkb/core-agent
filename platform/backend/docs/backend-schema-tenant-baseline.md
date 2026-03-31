# Tenant Schema Baseline

Status: current working baseline  
Date: 2026-03-30

## Scope

This document fixes the current tenant database baseline for:

- sandbox tenant databases
- dedicated tenant databases
- the first full bootstrap bundle: `bundle/tenant_schema_full.sql`

Sources used:

- `bundle/tenant_schema_full.sql`
- live local PostgreSQL introspection from `108-demo`
- legacy reference tables under `docs/MSSQL`

Important:

- in dedicated databases the schema is still tenant-shaped and keeps `tenant_id`
- in sandbox databases the same schema is shared by many tenants and must enforce tenant isolation
- `schema_migrations` is database-scoped and intentionally has no `tenant_id`
- this document describes the current technical baseline, not the final naming freeze
- if tenant naming is approved as legacy-compatible `<table>_<field>`, this bundle must be rebuilt before final schema freeze

## Current Bundle Contents

The current first full tenant bundle creates or seeds:

- `users`
- `companytype`
- `company`
- `projects`
- `projectsaccess`
- `events`
- `mails`
- `public_code`
- `notification_template`
- default `notification_template` rows for `otp`

The migration runtime then inserts bundle state into:

- `schema_migrations`

## Table Catalog

## Historical `contacts`

Purpose:

- historical transitional idea from an earlier baseline
- not part of the current tenant starter bundle

Columns:

- `id uuid not null`
- `tenant_id bigint not null`
- `name text not null`
- `email text null`
- `phone text null`
- `tags text[] null`
- `created_at timestamptz not null`

Keys and indexes:

- primary key: `contacts_pkey (id)`
- index: `idx_contacts_tenant (tenant_id)`
- index: `idx_contacts_email (tenant_id, email)`

Tenant rules:

- row-level security is enabled
- policy `p_contacts_tenant` requires `tenant_id = current_setting('app.tenant_id')`
- in sandbox DB this is a hard isolation boundary
- in dedicated DB it is still kept for shape consistency

Legacy MSSQL mapping:

- no direct table in the provided MSSQL dump
- nearest legacy concept is contact information embedded in `company.sql` and `projects.sql`, but not as a standalone contacts table

Decision:

- keep contact-style listing behavior in `users`
- do not treat `contacts` as an active starter table

## `users`

Purpose:

- tenant-local user record used by tenant runtime
- direct auth source for email/phone login inside the tenant database

Columns:

- `users_tenant_id bigint not null`
- `users_id bigint not null`
- `users_rowstamp bytea null`
- `users_tourread boolean null`
- `users_access boolean null`
- `users_act boolean not null`
- `users_active boolean generated`
- `users_admin boolean null`
- `users_company_id bigint null`
- `users_date timestamptz null`
- `users_dob date null`
- `users_email citext null`
- `users_firstname text null`
- `users_lastname text null`
- `users_middlename text null`
- `users_mobilephone text null`
- `users_pager text null`
- `users_password text null`
- `users_phone text null`
- `users_title text null`
- `users_username text null`
- `users_supervisor bigint null`
- `users_foreman bigint null`
- `users_desc text null`
- `users_hiredate date null`
- `users_rehiredate date null`
- `users_lastwork date null`
- `users_termwork date null`
- `users_sex text null`
- `users_num text null`
- `users_pcode text null`
- `users_last timestamptz null`
- `users_lastmodule text null`
- `users_lastaction text null`
- `users_lastpage text null`
- `users_lastwizard text null`
- `users_timezone text null`
- `users_address text null`
- `users_city text null`
- `users_state text null`
- `users_zip text null`
- `users_ssn text null`
- `users_pwddate timestamptz null`
- `users_terms boolean null`
- `users_pwdchanged integer null`
- `users_demo boolean null`
- `users_status text null`
- `users_reason text null`
- `users_occupation text null`
- `users_salery numeric(14,2) null`
- `users_saleryper numeric(14,2) null`
- `users_systemid text null`
- `users_auth integer null`
- `users_sysid text null`
- `users_site text null`
- `users_usersid text null`
- `users_etsadmin integer null`
- `users_1027_super bigint null`
- `users_1042_dep text null`
- `users_1042_super2 bigint null`
- `users_1042_super3 bigint null`
- `users_1042_super1 bigint null`
- `users_wccode text null`
- `users_wcdesc text null`
- `users_pushapp text null`
- `users_pushacc text null`
- `users_covidcheck boolean null`
- `users_honorific text null`
- `users_pincode text null`
- `users_codes jsonb null`
- `users_guid uuid not null`
- `users_created_at timestamptz not null`
- `users_updated_at timestamptz not null`

Keys and indexes:

- primary key: `users_pkey (users_tenant_id, users_id)`
- unique index: `ux_users_tenant_guid (users_tenant_id, users_guid)`
- unique index: `ux_users_tenant_email_ci (users_tenant_id, users_email) where users_email is not null`
- index: `idx_users_mobilephone (users_tenant_id, users_mobilephone)`
- index: `idx_users_phone (users_tenant_id, users_phone)`
- index: `idx_users_company_id (users_tenant_id, users_company_id)`
- index: `idx_users_act (users_tenant_id, users_act)`
- index: `idx_users_access (users_tenant_id, users_access)`
- index: `idx_users_admin (users_tenant_id, users_admin)`
- index: `idx_users_firstname (users_tenant_id, users_firstname)`
- index: `idx_users_lastname (users_tenant_id, users_lastname)`
- index: `idx_users_middlename (users_tenant_id, users_middlename)`
- index: `idx_users_auth (users_tenant_id, users_auth)`
- index: `idx_users_etsadmin (users_tenant_id, users_etsadmin)`

Tenant rules:

- row-level security is enabled
- policy `p_users_tenant` requires `users_tenant_id = current_setting('app.tenant_id')`
- email uniqueness is case-insensitive per tenant

Legacy MSSQL mapping:

- main source: `docs/MSSQL/users.sql`
- already represented in current baseline:
  - nearly the full `users.sql` column set
  - PostgreSQL alias `users_active` generated from legacy `users_act`
  - PostgreSQL metadata columns `users_created_at` and `users_updated_at`

Decision:

- current auth reads this table directly; no master identity mirror is used
- current tenant `users` is now legacy-shaped and no longer the old compact transitional table
- auth-facing stable identity is `users_guid`
- legacy/business key is `users_id`
- legacy flags must be preserved semantically in the final target model:
  - `users_access` means login access to the system
  - `users_act` means active/visible account and also affects directory/contact visibility
  - `users_admin` means tenant-local admin privilege, not platform-wide admin
- legacy system did not use a standalone contacts table; user/contact listing behavior came from `users`

## `public_code`

Purpose:

- public tenant-scoped codes such as survey or share links
- public route lookup surface

Columns:

- `code text not null`
- `tenant_id bigint not null`
- `resource_id uuid null`
- `expires_at timestamptz null`
- `metadata jsonb null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `public_code_pkey (code)`
- index: `idx_public_code_tenant (tenant_id)`
- partial index: `idx_public_code_expires (expires_at) where expires_at is not null`
- partial index: `idx_public_code_resource (resource_id) where resource_id is not null`

Tenant rules:

- no row-level security is enabled today
- service code must always constrain reads and writes by `tenant_id`
- acceptable for public flows only if token validation or route logic resolves tenant explicitly

Legacy MSSQL mapping:

- no direct table in the provided MSSQL dump

Open point:

- if public-code usage expands beyond survey/public-link style flows, tenant-safe read rules should be revisited

## `notification_template`

Purpose:

- global notification templates
- tenant override templates for email and SMS

Columns:

- `id uuid not null`
- `tenant_id bigint null`
- `kind text not null`
- `key text not null`
- `locale text not null`
- `subject text null`
- `html text null`
- `text text null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `notification_template_pkey (id)`
- unique key: `(tenant_id, kind, key, locale)`
- index: `ix_notification_template_tenant (tenant_id)`
- index: `ix_notification_template_key (kind, key)`

Tenant rules:

- `tenant_id null` means global default template
- tenant-specific overrides use concrete `tenant_id`
- no row-level security is enabled today
- template reads must be constrained in repository logic

Legacy MSSQL mapping:

- no direct template table in provided MSSQL
- nearest operational concept is `docs/MSSQL/mails.sql`, but that table stores sent messages, not reusable templates

Decision:

- keep templates in tenant DB, not master DB
- allow global rows with `tenant_id null` for low-friction bootstrap

## `events`

Purpose:

- canonical auth and business event audit log inside tenant data boundary
- sink for `otp_request`, auth failures, `login`, and future domain events
- first candidate for partitioning in shared sandbox databases

Columns:

- `events_id bigint not null`
- `events_guid uuid not null`
- `events_tenant_id bigint not null`
- `events_date date null`
- `events_event text not null`
- `events_module text null`
- `events_record bigint null`
- `events_table text null`
- `events_text text null`
- `events_time timestamptz null`
- `events_timezone text null`
- `events_users_id bigint null`
- `events_principal_guid uuid null`
- `events_users_ip inet null`
- `events_to text null`
- `events_subject text null`
- `events_body text null`
- `events_data jsonb not null`
- `events_files jsonb null`
- `events_urls jsonb null`
- `events_created_at timestamptz not null`
- `events_updated_at timestamptz not null`

Keys and indexes:

- primary key: `(events_created_at, events_id)`
- index: `ix_events_tenant_created (events_tenant_id, events_created_at desc)`
- index: `ix_events_tenant_guid_created (events_tenant_id, events_guid, events_created_at desc)`
- index: `ix_events_tenant_event_created (events_tenant_id, events_event, events_created_at desc)`
- partial index: `ix_events_tenant_principal_created (events_tenant_id, events_principal_guid, events_created_at desc)`
- index: `ix_events_tenant_module_created (events_tenant_id, events_module, events_created_at desc)`

Tenant rules:

- row-level security is enabled
- policy `p_events_tenant` requires `events_tenant_id = current_setting('app.tenant_id')`
- sandbox writes must set `app.tenant_id` before insert
- dedicated DB still writes explicit `tenant_id` for shape consistency
- table is partitioned by `RANGE (events_created_at)`
- quarterly partitions are the accepted baseline
- new partitions must be created ahead of time as part of operational schema maintenance

Legacy MSSQL mapping:

- main source: `docs/MSSQL/events.sql`
- conceptually related: `docs/MSSQL/mails.sql`
- already represented in current baseline:
  - `events_users_id` -> `events_users_id`
  - `events_event` -> `events_event`
  - `events_users_ip` -> `events_users_ip`
  - free-form event payload -> `events_data`
- intentionally not mirrored 1:1:
  - current PostgreSQL baseline adds `events_guid` as stable UUID identity for event rows
  - current PostgreSQL baseline adds `events_principal_guid` for canonical actor UUID identity
  - auth payload may include full email/phone and raw OTP in `events_data` by product requirement

Actor identity rules:

- tenant legacy event: `events_users_id` populated, `events_principal_guid` optional
- admin or root event: `events_users_id = null`, `events_principal_guid = uuid`
- migrated MSSQL event: `events_users_id` populated, `events_principal_guid = null`

Decision:

- tenant event history lives in tenant DB, not master DB
- `events` is the single canonical event table
- `events_data` is the extensibility point for auth and domain payload
- `event_log` is not part of the accepted tenant baseline anymore

## `schema_migrations`

Purpose:

- per-database migration state tracking
- records bundle marker and later incremental tenant migrations

Columns:

- `version text not null`
- `applied_at timestamptz not null`

Keys and indexes:

- primary key: `schema_migrations_pkey (version)`

Tenant rules:

- this table is database-scoped, not tenant-scoped
- it intentionally has no `tenant_id`
- one sandbox DB has one `schema_migrations` state shared by all tenants in that DB

Legacy MSSQL mapping:

- no legacy equivalent in provided MSSQL dump

## Accepted Tenant Baseline Decisions

- keep `tenant_id` on tenant tables even for dedicated databases
- use RLS for shared/sandbox operational tables where reads are tenant-private
- keep `events` in tenant DB as the single canonical event table
- keep `notification_template` in tenant DB
- keep `public_code` in tenant DB
- do not expand `users` blindly from legacy MSSQL until a target profile/user model is explicitly accepted

## Current Gaps

- `public_code` has no RLS yet
- `notification_template` has no RLS yet
- no first-class tables yet for:
  - company
  - project
  - project access
  - richer user profile
  - outbound mail log

These should be added through new tenant migrations after target field sets are accepted.
