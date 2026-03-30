# Master Schema Baseline

Status: approved target baseline  
Date: 2026-03-30

## Scope

This document fixes the approved master database baseline for the next cleanup and rebuild:

- tenant registry
- DB placement
- auth control data
- admin access
- migration coordination

Sources used:

- `migrations/postgres/master/*.sql`
- live local PostgreSQL introspection from `108-master`
- legacy reference tables under `docs/MSSQL`

Important:

- `108-master` is the single control-plane database
- current local live DB may lag behind this approved target baseline until the next migration cleanup/rebuild
- master tables do not use tenant RLS
- tenant isolation in master is enforced by service logic and explicit tenant filters
- master naming is expected to stay modern snake_case unless a specific compatibility reason appears
- master uses GUID only where a row is a stable external or session-facing identity
- master control and history rows otherwise stay on compact integer keys
- master now also owns a canonical `events` table for admin auth and control-plane audit

## Master Types And Views

Enums:

- `plan_t`: `trial`, `light`, `pro`, `enterprise`
- `isolation_mode`: `sandbox`, `dedicated_schema`, `dedicated_db`

Views:

- `v_tenant_current_plan`
- `v_tenant_by_host`

## Table Catalog

## `db_instance`

Purpose:

- registry of physical or logical PostgreSQL instances
- source of DSN or secret lookup for tenant placement

Columns:

- `id bigint not null`
- `code text not null`
- `dns text null`
- `secret_name text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `db_instance_pkey (id)`
- unique key: `db_instance_code_key (code)`
- index: `ix_db_instance_updated_at (updated_at)`

Rules:

- at least one of `dns` or `secret_name` must be present
- this is master-only infrastructure metadata

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `tenant`

Purpose:

- canonical tenant registry row

Columns:

- `id bigint not null`
- `guid uuid not null`
- `name text not null`
- `isolation isolation_mode not null`
- `status text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `tenant_pkey (id)`
- unique key: `tenant_guid_key (guid)`
- index: `ix_tenant_updated_at (updated_at)`
- index: `ix_tenant_status (status)`

Rules:

- tenant ids start from `100`
- current allowed statuses: `active`, `suspended`
- current isolation modes are explicit and part of routing/placement logic
- external platform/admin APIs should prefer `tenant.guid` over exposing sequential `tenant.id`

Legacy MSSQL mapping:

- main source: `docs/MSSQL/company.sql`
- already represented:
  - company identity/name -> `tenant.name`
  - demo/shared placement intent -> `tenant.isolation`
  - active status -> `tenant.status`
- not yet represented:
  - address/contact/legal fields
  - NAICS/product/vendor/premium wide metadata

Decision:

- master `tenant` stays compact
- business/company profile fields should live in future tenant or admin domain tables, not in control-plane registry by default

## `tenant_domain`

Purpose:

- host to tenant binding for resolver and API Gateway host-based routing

Columns:

- `id bigint not null`
- `tenant_id bigint not null`
- `host text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `tenant_domain_pkey (id)`
- index: `ix_tenant_domain_host (host)`
- index: `ix_tenant_domain_tenant (tenant_id)`
- index: `ix_tenant_domain_updated_at (updated_at)`

Rules:

- `host` must be lowercase
- each row belongs to one tenant

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `tenant_db`

Purpose:

- binds tenant to concrete application database

Columns:

- `id bigint not null`
- `tenant_id bigint not null`
- `db_instance_id bigint not null`
- `db_name text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `tenant_db_pkey (id)`
- unique index: `ux_tenant_db_tenant_one (tenant_id)`
- unique index: `ux_tenant_db_tenant_instance_name (tenant_id, db_instance_id, db_name)`
- index: `ix_tenant_db_instance (db_instance_id)`
- index: `ix_tenant_db_updated_at (updated_at)`

Rules:

- exactly one active app DB row per tenant in current model
- this is the primary source of truth for app DB placement

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `tenant_plan_history`

Purpose:

- temporal record of tenant plan history
- source for current plan view

Columns:

- `id bigint not null`
- `tenant_id bigint not null`
- `plan plan_t not null`
- `valid_from timestamptz not null`
- `valid_to timestamptz null`
- `created_at timestamptz not null`

Keys and indexes:

- primary key: `tenant_plan_history_pkey (id)`
- partial index: `ix_tenant_plan_open (tenant_id, valid_from desc) where valid_to is null`
- partial index: `ix_tenant_plan_closed (tenant_id, valid_from desc, valid_to) where valid_to is not null`

Rules:

- current plan is resolved through `v_tenant_current_plan`
- open interval means active plan row

Legacy MSSQL mapping:

- partial conceptual mapping from `docs/MSSQL/company.sql`:
  - `company_product`
  - `company_premium`
  - `company_demo`
- PostgreSQL baseline normalizes this into temporal plan history instead of flags

## `tenant_sandbox_pool`

Purpose:

- registry of shared tenant databases used for sandbox tenants

Columns:

- `id bigint not null`
- `code text not null`
- `plan plan_t not null`
- `db_instance_id bigint not null`
- `db_name text not null`
- `is_default boolean not null`
- `weight smallint not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `tenant_sandbox_pool_pkey (id)`
- unique key: `tenant_sandbox_pool_code_key (code)`
- index: `ix_tenant_sandbox_pool_plan (plan)`

Rules:

- `db_name` must be lowercase
- used by onboarding logic for shared placement

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `tenant_dedicated_pool`

Purpose:

- registry of dedicated tenant placement templates

Columns:

- `id bigint not null`
- `code text not null`
- `plan plan_t not null`
- `db_instance_id bigint not null`
- `db_prefix text not null`
- `is_default boolean not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `tenant_dedicated_pool_pkey (id)`
- unique key: `tenant_dedicated_pool_code_key (code)`
- index: `ix_tenant_dedicated_pool_plan (plan)`

Rules:

- `db_prefix` must be non-empty
- used by onboarding logic for dedicated database creation

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `auth_otp`

Purpose:

- stores active one-time password challenges

Columns:

- `id uuid not null`
- `tenant_id bigint not null`
- `channel text not null`
- `address text not null`
- `code_hash text not null`
- `expires_at timestamptz not null`
- `attempts integer not null`
- `created_at timestamptz not null`

Keys and indexes:

- primary key: `auth_otp_pkey (id)`
- index: `ix_auth_otp_lookup (tenant_id, channel, address, created_at desc)`
- index: `ix_auth_otp_expires (tenant_id, expires_at)`

Rules:

- no raw OTP code is persisted
- rows are master-scoped but always tenant-qualified
- auth service must clean expired rows
- on successful verification, auth service must delete all OTP rows for that tenant/channel/address
- raw OTP and full address are written to tenant `events`, not to `auth_otp`

Legacy MSSQL mapping:

- no direct OTP table was present in the provided MSSQL dump

## `auth_refresh_token`

Purpose:

- stores refresh session tokens

Columns:

- `id uuid not null`
- `tenant_id bigint not null`
- `user_id uuid not null`
- `token_hash text not null`
- `client_id text null`
- `device_id text null`
- `created_at timestamptz not null`
- `expires_at timestamptz not null`
- `revoked_at timestamptz null`

Keys and indexes:

- primary key: `auth_refresh_token_pkey (id)`
- unique key: `auth_refresh_token_token_hash_key (token_hash)`
- index: `ix_refresh_token_user (tenant_id, user_id)`
- index: `ix_refresh_token_expires (tenant_id, expires_at)`
- partial index: `ix_refresh_token_revoked (tenant_id, revoked_at) where revoked_at is null`

Rules:

- raw refresh token is never persisted
- revocation is soft via `revoked_at`
- tenant filter is mandatory in auth flows
- this is a session/security table, so UUID identity is correct here

Legacy MSSQL mapping:

- no direct refresh-token table in the provided MSSQL dump

## `tenant_auth_policy`

Purpose:

- stores tenant-specific auth rules used by the auth service before business runtime work begins

Columns:

- `tenant_id bigint not null`
- `otp_length smallint not null`
- `otp_ttl_seconds integer not null`
- `otp_max_attempts smallint not null`
- `otp_email_enabled boolean not null`
- `otp_phone_enabled boolean not null`
- `login_requires_users_access boolean not null`
- `login_requires_users_act boolean not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Keys and indexes:

- primary key: `tenant_auth_policy_pkey (tenant_id)`

Rules:

- this is a control-plane table, not a tenant-business table
- it drives direct tenant auth behavior without mirroring tenant users into master
- current accepted defaults are:
  - OTP length `6`
  - OTP TTL `600`
  - OTP max attempts `5`

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `admin_tenant_access_audit`

Purpose:

- durable platform-side audit whenever an admin enters or exchanges into tenant context

Columns:

- `id bigint not null`
- `admin_user_id uuid not null`
- `tenant_id bigint not null`
- `action text not null`
- `access_mode text not null`
- `ip_address inet null`
- `user_agent text null`
- `metadata jsonb null`
- `created_at timestamptz not null`

Keys and indexes:

- primary key: `admin_tenant_access_audit_pkey (id)`
- index: `(tenant_id, created_at desc)`
- index: `(admin_user_id, created_at desc)`
- index: `(action, created_at desc)`

Rules:

- this is platform audit and must remain in master
- delegated tenant sessions for platform root must carry `role = root`

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `admin_user`

Purpose:

- root admin identities for `api-admin`

Columns:

- `id uuid not null`
- `email citext not null`
- `name text null`
- `level integer not null`
- `status text not null`
- `created_at timestamptz not null`

Keys and indexes:

- primary key: `admin_user_pkey (id)`
- unique key: `admin_user_email_key (email)`
- index: `ix_admin_user_email (email)`
- partial index: `ix_admin_user_status (status) where status <> 'active'`

Rules:

- current default level is `100`
- platform admin levels are fixed as:
  - `100 = root`
  - `80 = admin`
  - `60 = support`
  - `40 = readonly`
- root/admin semantics stay explicit and separate from tenant user semantics
- `admin_user.level` is platform-level authority in master
- when platform root enters tenant context, the delegated tenant token must carry:
  - `scope = tenant.api`
  - `role = root`
  - `level = 100`
  - metadata tying the session back to `admin_user`
- this is a platform identity table, so UUID identity is correct here

Legacy MSSQL mapping:

- conceptual source: `docs/MSSQL/users.sql`
- closest legacy fields:
  - `users_admin`
  - `users_etsadmin`
- PostgreSQL baseline intentionally separates root admins from tenant users

## `migration_runs`

Purpose:

- tracks cross-database migration execution

Columns:

- `id bigint not null`
- `version text not null`
- `started_at timestamptz not null`
- `completed_at timestamptz null`
- `status text not null`
- `error text null`
- `applied_dbs text[] null`

Keys and indexes:

- primary key: `migration_runs_pkey (id)`
- partial unique index: `ux_migration_runs_running (version, status) where status = 'running'`
- index: `idx_migration_runs_status (status, started_at desc)`

Rules:

- one running migration per version
- control-plane audit only, no tenant RLS

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## `schema_migrations`

Purpose:

- master schema version state

Columns:

- `version text not null`
- `applied_at timestamptz not null`

Keys and indexes:

- primary key: `schema_migrations_pkey (version)`

Legacy MSSQL mapping:

- no direct equivalent in provided MSSQL dump

## Master Views

## `v_tenant_current_plan`

Purpose:

- resolves the currently active plan row from `tenant_plan_history`

Rules:

- selects the latest valid interval by `valid_from`

## `v_tenant_by_host`

Purpose:

- resolver read model for host -> tenant -> database lookup

Fields exposed:

- host
- tenant id and name
- current plan
- isolation and status
- db name
- db instance metadata
- aggregate updated timestamp

Decision:

- keep this view as the main resolver surface for runtime tenant lookup

## Accepted Master Baseline Decisions

- master keeps only control-plane data, not full tenant business data
- auth control tables stay in master
- tenant login identity is read directly from tenant DB, not mirrored in master
- host and DB routing stay in master
- admin users stay separate from tenant users

## Current Gaps

- no direct company/business profile table yet in master
- no direct outbound mail/SMS delivery log in master
