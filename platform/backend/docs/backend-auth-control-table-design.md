# Backend Auth Control Table Design

Status: accepted working baseline  
Date: 2026-03-30

## Goal

Define the control-plane tables that remain necessary after moving auth to direct tenant user lookup.

## Current Auth Control Tables

Active master auth/control tables:

- `tenant_auth_policy`
- `auth_otp`
- `auth_refresh_token`
- `admin_user`
- `events`
- `admin_tenant_access_audit`

Removed from active auth contour:

- `identity_subject`
- `identity_tenant_membership`

Reason:

- auth now reads login email and phone directly from tenant `users`
- role and level also come directly from tenant `users`
- master no longer mirrors tenant login identity state

## `tenant_auth_policy`

Purpose:

- tenant-specific auth rules used by the auth service before business logic runs

Columns:

- `tenant_id bigint primary key references tenant(id)`
- `otp_length smallint not null default 6`
- `otp_ttl_seconds integer not null default 600`
- `otp_max_attempts smallint not null default 5`
- `otp_email_enabled boolean not null default true`
- `otp_phone_enabled boolean not null default true`
- `login_requires_users_access boolean not null default true`
- `login_requires_users_act boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Checks:

- `otp_length between 4 and 10`
- `otp_ttl_seconds between 60 and 3600`
- `otp_max_attempts between 1 and 10`

## `admin_tenant_access_audit`

Purpose:

- durable audit trail when a platform admin enters tenant context

Columns:

- `id bigserial primary key`
- `admin_user_id uuid not null references admin_user(id)`
- `tenant_id bigint not null references tenant(id)`
- `action text not null`
- `access_mode text not null`
- `ip_address inet null`
- `user_agent text null`
- `metadata jsonb null`
- `created_at timestamptz not null default now()`

Typical actions:

- `enter_tenant`
- `admin_token_exchange`
- `impersonation_start`
- `impersonation_end`

Typical access modes:

- `scoped_root_session`
- `support_readonly`
- `impersonation`

## `admin_user`

Purpose:

- platform admin principal used by admin auth and admin `/profile`

Columns:

- `id uuid primary key`
- `email citext not null unique`
- `phone text null`
- `name text null`
- `level int not null default 100`
- `status text not null default 'active'`
- `created_at timestamptz not null default now()`

Role mapping:

- `100 = root`
- `80 = admin`
- `60 = support`
- `40 = readonly`

Current rule:

- admin auth issues `scope=admin.api`
- delegated tenant token exchange is a separate future flow

## `auth_refresh_token`

Purpose:

- stores refresh-session rows as versioned members of a session family

Columns:

- `id uuid primary key`
- `session_id uuid not null`
- `tenant_id bigint not null`
- `user_id uuid not null`
- `surface text not null`
- `token_hash text not null unique`
- `token_family_id uuid not null`
- `client_id text null`
- `device_id text null`
- `ip_address inet null`
- `user_agent text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `expires_at timestamptz not null`
- `revoked_at timestamptz null`
- `rotated_at timestamptz null`

Working interpretation:

- one row = one issued refresh token version
- `session_id` = one app/browser session contour
- `token_family_id` = rotation family for reuse detection and family revoke
- `surface` = `tenant` or `admin`

Current Phase 1 state:

- schema is ready for session-family behavior
- repository stores and loads the new fields
- issuance now stamps `session_id`, `token_family_id`, `surface`, `ip_address`, and `user_agent`

Current Phase 2 state:

- refresh flow now loads raw token records before state evaluation
- successful refresh rotates the current token version and inserts the successor inside one transaction
- rotated-token reuse revokes the active family members
- `session_id` and `token_family_id` continuity is now enforced by the refresh path

## Tenant User Table Requirements

Direct tenant auth requires at minimum:

- `users.email`
- `users.phone`
- `users.access`
- `users.active`
- `users.admin`
- `users.role`
- `users.level`

These fields are now auth-critical and must exist in every tenant bootstrap.

## `events`

Accepted decision:

- `events` is the canonical auth audit table in both tenant DB and master DB
- `event_log` is no longer part of the active contract

Master-side use:

- admin auth events
- future control-plane audit events

Required fields for auth logging:

- `events_event`
- `events_module`
- `events_text`
- `events_actor_guid`
- `events_users_ip`
- `events_to`
- `events_data`
- `events_created_at`

Auth logging requirements:

- success and failure events are both written
- raw OTP code must be written to `events_text`
- full email or phone may be written to `events_data`

## Partitioning

Accepted first partitioned table:

- `events`

Accepted strategy:

- `PARTITION BY RANGE (events_created_at)`
- quarterly partitions
- explicit migration-managed partition creation
- `DEFAULT` partition as safety net

Required indexes per partition set:

- `(events_tenant_id, events_created_at desc)`
- `(events_tenant_id, events_event, events_created_at desc)`
