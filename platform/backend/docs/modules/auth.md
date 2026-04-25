# Backend Auth Module

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: backend auth module behavior, tenant resolution, OTP, refresh, logout, and profile boundary

This module doc defines the accepted backend auth boundary.

Read with:

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`

## Current Model

Accepted tenant auth model:

- `tenant_host -> tenant_id -> tenant_db` is resolved through master control-plane data
- `cmd/auth` reads the user directly from the target tenant database
- login lookup uses tenant-local `users.email` or `users.phone`
- authorization gates come from tenant-local `users`
- master keeps control-plane auth state, not a tenant login identity mirror

This means:

- no global identity mirror is required for auth correctness
- no tenant-to-master user sync is required for auth correctness
- master remains a control plane, not a tenant user directory

## Backend Surfaces

Runtime:

- `platform/backend/cmd/auth`

Shared modules:

- `platform/backend/modules/shared/authentication`
- `platform/backend/modules/shared/sessions`

Profile surfaces:

- `platform/backend/modules/admin/profile`
- `platform/backend/modules/tenant/profile`

Platform primitives:

- `platform/backend/internal/platform/auth`
- `platform/backend/internal/platform/tenant`

## Tenant Resolution

Accepted routing strategy:

- every tenant gets its own host, even in sandbox
- sandbox sharing happens at database level, not host level
- public tenant auth routes must resolve tenant from trusted host/origin context
- frontend must not send tenant id during login

Reason:

- host-based tenant resolution stays deterministic
- public auth routes stay tenant-safe
- shared sandbox DBs can still isolate tenants by `tenant_id`

## OTP Lifecycle

Accepted baseline:

- default OTP length: `6`
- per-tenant override comes from `tenant_auth_policy`
- TTL: `10m`
- max attempts: `5`

Request contract:

- OTP request returns effective `otp_length`
- tenant auth returns resolved tenant policy length
- admin auth returns the configured admin length

Storage:

- `auth_otp` stores only `code_hash`
- raw OTP is not stored in `auth_otp`

Lifecycle:

- still-valid codes remain valid until TTL expires
- successful verification deletes active OTP rows for the tenant/channel/address
- invalid verification increments attempts on active OTP rows for the address
- expired OTP rows are hard-deleted by cleanup

## Refresh And Logout

Refresh baseline:

- refresh token lives in an `HttpOnly` cookie
- `auth_refresh_token` stores only token hash
- successful refresh rotates the current token and issues a successor
- rotated-token reuse revokes active family members
- refresh and logout require allowed browser origin

Logout baseline:

- logout reads refresh token from cookie
- logout revokes backend session state
- logout clears the refresh cookie

Frontend behavior is defined in `platform/frontend/docs/contracts/auth-runtime.md`.

## Profile And Navigation Boundary

- `/app/profile` owns authenticated profile bootstrap.
- Admin navigation is separate and comes from `/app/me/navigation`.
- Do not combine navigation payloads into profile unless a new contract explicitly changes that boundary.

## Admin To Tenant Access

Admin-to-tenant delegated access is not part of normal frontend login.

Accepted distinction:

- `admin_user.level` is platform authority in master
- tenant-local `users.admin` is tenant authority
- platform root and tenant admin are different authority classes

Delegated tenant token exchange remains a separate flow and must keep metadata linking the delegated token back to the admin principal.

## Event Boundary

- `events` is the canonical auth audit table in both tenant DB and master DB.
- Tenant auth events write to tenant `events`.
- Admin auth events write to master `events`.
- Event partitioning belongs to schema/migration contracts, not ad hoc app behavior.

## Out Of Scope

- Cognito
- master identity mirror for tenant auth
- frontend-provided tenant identity
- admin impersonation as part of normal auth
