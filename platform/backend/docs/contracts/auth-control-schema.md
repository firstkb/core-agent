# Backend Auth Control Schema Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: master auth/control schema and tenant auth-facing user requirements

This contract defines the control-plane tables required by the current auth model.

Read with:

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/contracts/schema-tenancy.md`

## Active Master Auth And Control Tables

- `tenant_auth_policy`
- `auth_otp`
- `auth_refresh_token`
- `admin_user`
- `events`
- `admin_tenant_access_audit`

Removed from the active auth contour:

- `identity_subject`
- `identity_tenant_membership`

Reason:

- tenant auth reads login email and phone directly from tenant `users`
- tenant role and level come directly from tenant `users`
- master does not mirror tenant login identity state

## `tenant_auth_policy`

Purpose:

- tenant-specific auth rules used by auth service before business logic runs

Required behavior:

- effective OTP length comes from tenant policy for tenant auth
- login gates may require tenant `users.access`
- login gates may require tenant `users.active`

Baseline limits:

- OTP length between `4` and `10`
- OTP TTL between `60` and `3600` seconds
- OTP max attempts between `1` and `10`

## `auth_otp`

Purpose:

- master-side OTP lifecycle storage

Rules:

- store only `code_hash`
- do not store raw OTP in `auth_otp`
- expired OTP rows are hard-deleted by cleanup
- successful verification deletes active OTP rows for the same tenant, channel, and address
- invalid verification increments attempts on active OTP rows for the address

## `auth_refresh_token`

Purpose:

- stores refresh-session rows as versioned members of a session family

Required behavior:

- store only token hash
- one row represents one issued refresh token version
- `session_id` represents one app/browser session contour
- `token_family_id` represents rotation family for reuse detection and family revoke
- `surface` distinguishes `tenant` and `admin`
- successful refresh rotates the current token version and inserts the successor in one transaction
- rotated-token reuse revokes active family members
- logout revokes active tokens according to logout scope

## `admin_user`

Purpose:

- platform admin principal used by admin auth and admin profile

Accepted platform levels:

- `100 = root`
- `80 = admin`
- `60 = support`
- `40 = readonly`

Current rule:

- admin auth issues `scope=admin.api`
- delegated tenant token exchange is a separate future flow

## Tenant User Requirements

Direct tenant auth requires every tenant bootstrap to provide these auth-facing fields on `users`:

- `users.id`
- `users.email`
- `users.phone`
- `users.access`
- `users.active`
- `users.admin`
- `users.role`
- `users.level`

Current login gates:

- `users.access = true` when tenant auth policy requires user access
- `users.active = true` when tenant auth policy requires active user

Legacy meaning to preserve:

- `users_access`: permission to log in
- `users_act`: active and visible account
- `users_admin`: tenant-local admin only

## `events`

Accepted decision:

- `events` is the canonical auth audit table in both tenant DB and master DB.
- `event_log` is not part of the active auth contract.

Master-side use:

- admin auth events
- future control-plane audit events

Tenant-side use:

- tenant auth events
- tenant-visible auth/business activity

Auth logging rules:

- success and failure events are both written where required by the auth boundary
- raw OTP is not stored in `auth_otp`
- raw OTP may be written to auth event text/data according to current audit policy
- tenant user events should include user id when tenant row id is known
- admin/root events should record principal identity through the master-side actor fields

## Partitioning

Accepted first partitioned table:

- `events`

Accepted strategy:

- partition by range on `created_at`
- use quarterly partitions
- create partitions through migrations
- keep a default partition as safety net
