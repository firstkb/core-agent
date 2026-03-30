# Backend Auth Boundary

Status: accepted working decision  
Date: 2026-03-30

## Goal

Fix the auth boundary so that:

- tenant user identity is read directly from each tenant database
- master keeps only control-plane auth state
- no `identity_subject` or `identity_tenant_membership` mirror is required

## Direct Auth Model

Accepted model:

- `tenant_host -> tenant_id -> tenant_db` is resolved in master
- `auth` then reads the user directly from the target tenant database
- login lookup uses tenant-local `users.email` or `users.phone`
- authorization gates also come from tenant-local `users`

This means:

- no global identity mirror in master
- no tenant-to-master user sync is required for auth correctness
- master remains a control-plane, not a user directory

## Master Responsibilities

Master owns:

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
- `events`
- `admin_tenant_access_audit`
- `migration_runs`

Master does not own tenant login identities anymore.

## Tenant Responsibilities

Tenant DB owns the auth-facing user record:

- `users.id`
- `users.email`
- `users.phone`
- `users.access`
- `users.active`
- `users.admin`
- `users.role`
- `users.level`

Current login gates:

- `users.access = true` when `tenant_auth_policy.login_requires_users_access = true`
- `users.active = true` when `tenant_auth_policy.login_requires_users_act = true`

Legacy meaning that must be preserved:

- `users_access` = permission to log in
- `users_act` = active and visible account
- `users_admin` = tenant-local admin only

## Host Strategy

Accepted routing strategy:

- every tenant gets its own host, even in sandbox
- sandbox sharing happens at DB level, not at host level

Reason:

- host-based tenant resolution stays deterministic
- auth public routes stay tenant-safe
- shared sandbox databases still isolate tenants by `tenant_id` and RLS

## OTP Lifecycle

Accepted baseline:

- default OTP length: `6`
- per-tenant override comes from `tenant_auth_policy`
- TTL: `10m`
- max attempts: `5`

Request contract decision:

- `otp_request` should return the effective `otp_length`
- tenant auth returns the resolved tenant policy length
- admin auth currently returns the global admin length from config

Accepted behavior:

- new OTP request deletes only expired rows for the same `tenant + channel + address`
- still-valid codes remain valid until TTL expires
- any still-valid code in the window may verify successfully
- successful verification deletes all OTP rows for that `tenant + channel + address`
- invalid verification increments attempts on active OTP rows for that address

Storage decision:

- `auth_otp` in master stores only `code_hash`
- raw OTP is not stored in `auth_otp`
- raw OTP is written to `events`

Logging decision:

- canonical auth audit table is `events` in both tenant DB and master DB
- `otp_request` must be logged with raw OTP in `events_text`
- `login` must be logged with `events_text = OK`
- auth failures must be logged
- extra positive auth events like `otp_verify`, `token_refresh`, and `logout` are intentionally not written
- `events_data` may contain raw OTP, full email, full phone, and failure reasons

Cleanup:

- cleanup job every `5-15` minutes
- expired OTP rows are hard-deleted

## Refresh Token Lifecycle

Accepted baseline:

- `auth_refresh_token` stays in master
- only token hash is stored
- refresh revokes the old refresh token
- logout revokes all active refresh tokens for the same tenant user
- expired rows are cleaned regularly

Optional retention:

- revoked rows may be retained `7-30` days if later audit policy requires it

## Admin To Tenant Access

Accepted platform levels:

- `100 = root`
- `80 = admin`
- `60 = support`
- `40 = readonly`

Important distinction:

- `admin_user.level` is platform authority in master
- delegated tenant token must use `role=root`, not `role=admin`

Required delegated tenant token shape for platform root:

- `scope = tenant.api`
- `role = root`
- `level = 100`
- metadata linking the token back to `admin_user`

Reason:

- tenant-local admin and platform root are different authority classes

## Partitioning

Accepted event strategy:

- `events` is the single canonical tenant audit/event table
- first partitioning candidate is `events`
- partitioning mode is quarterly range partitioning on `events_created_at`
- partitions are created by schema/migration contract, not ad hoc by the app

Required indexes:

- `(events_tenant_id, events_created_at desc)`
- `(events_tenant_id, events_event, events_created_at desc)`
