# Backend Current-To-Target Map

Status: working draft
Scope: backend restructuring baseline for the Go/PostgreSQL runtime
Date: 2026-03-29

## Fixed decisions

- `api-client` is renamed to `api-tenant`.
- `scapi` is retired and removed from the active backend tree.
- `auth` is a dedicated runtime for email and phone OTP authentication.
- Cognito is not part of the target authentication model.
- OTP request and OTP verify flows must log both successful and failed outcomes to the events log.
- PostgreSQL is the target runtime database.
- `docs/MSSQL` is a legacy source-shape reference, not the target schema contract.
- The platform remains a modular monolith with multiple runtimes.
- Tenant-aware design is required in the current engine.
- For shared-database and sandbox operation, application tables must carry `tenant_id`.
- Even for dedicated databases, retaining `tenant_id` is preferred for portability, operational consistency, and simpler future extraction.
- `api-tenant` and `api-admin` target AWS API Gateway JWT authorizers with self-issued RSA tokens and JWKS.
- The auth gateway baseline is documented in `docs/backend-auth-gateway-contract.md`.

## Module identity

- Backend module path is `dtriton.com/platform/backend`.
- The module path is intentionally decoupled from the current GitHub repository location.
- `dtriton.com` is preferred over `d-triton.com` and `digitaltriton.us` for shorter and cleaner import paths.
- Near-term compatibility can remain on the currently installed toolchain.
- Recommended upgrade target is Go `1.26.x` after local and CI toolchains are updated.

## Proposed target structure

```text
platform/backend/
  README.md
  docs/

  cmd/
    api-tenant/
      main.go
      internal/server/
        app.go
        routes.go
        middleware.go
        wire.go

    api-admin/
      main.go
      internal/server/
        app.go
        routes.go
        middleware.go
        wire.go

    auth/
      main.go
      internal/server/
        app.go
        routes.go
        middleware.go
        wire.go

    worker/
      main.go
      internal/runtime/
        app.go
        wire.go

    migrate/
      main.go

  internal/
    platform/
      auth/
      config/
      errors/
      hosting/
      httpx/
      logging/
      notify/
      options/
      postgres/
      tenant/

  modules/
    tenant/
      profile/
      projects/

    admin/
      tenantmanagement/
      companies/

    shared/
      audit/
      authentication/
      forms/
      notifications/
      sessions/
```

## Runtime ownership

### `cmd/api-tenant`

Tenant-scoped business API.

Initial responsibility:

- `/profile`
- tenant-scoped project access
- public tenant entrypoints such as survey or form links
- future tenant modules such as dashboard, incidents, action items

### `cmd/api-admin`

Control-plane and master-level administration API.

Initial responsibility:

- tenant onboarding
- tenant lifecycle and plan changes
- company and company type management
- future control-plane configuration

### `cmd/auth`

Authentication runtime.

Initial responsibility:

- request OTP by email or phone
- verify OTP
- issue access token
- issue refresh token
- logout and revoke sessions
- publish JWKS
- log auth success and auth failure events

### `cmd/worker`

Async and scheduled runtime.

Initial responsibility:

- cleanup expired OTP records
- cleanup expired or revoked refresh tokens
- notification delivery jobs
- future report, audit, and provisioning jobs

### `cmd/migrate`

Dedicated migration runtime.

Initial responsibility:

- run master migrations
- run tenant database migrations
- record migration runs
- remove migration execution from API startup

## Current package to target package map

| Current package or path | Target package or path | Action | Notes |
| --- | --- | --- | --- |
| `cmd/scapi/main.go` | `cmd/api-tenant/main.go`, `cmd/api-admin/main.go`, `cmd/auth/main.go` | split | The single runtime entrypoint is replaced by explicit runtimes. |
| `cmd/scapi/internal/hosted_service.go` | `cmd/*/internal/server/app.go` or `internal/platform/hosting/*` | split | Hosting wrapper should become runtime-local plus shared hosting primitives. |
| `cmd/scapi/internal/server/*` | `cmd/api-tenant/internal/server/*`, `cmd/api-admin/internal/server/*`, `cmd/auth/internal/server/*` | split | Keep only runtime wiring, routes, and middleware chains in `cmd/*`. |
| `cmd/scapi/lambda/*` | removed from baseline target | remove | Reintroduce later only as an explicit adapter runtime if still needed. |
| `cmd/scapi/internal/server/handler/auth/*` | `modules/shared/authentication/*` | move | Handler logic belongs to the auth business module, route wiring stays in `cmd/auth`. |
| `cmd/scapi/internal/server/middleware/*` | `internal/platform/httpx/*`, `internal/platform/auth/*`, `internal/platform/tenant/*` | split | Generic HTTP middleware stays platform-level; runtime chain assembly stays in `cmd/*`. |
| `cmd/scapi/internal/authsvc/*` | `modules/shared/authentication/*`, `modules/shared/sessions/*` | split | OTP flow, token issue, refresh, and logout become shared business modules used by `cmd/auth`. |
| `cmd/scapi/internal/notifysvc/*` | `modules/shared/notifications/*` | move | Template lookup and business notification sending should wrap platform notify adapters. |
| `cmd/scapi/internal/eventsvc/*` | `modules/shared/audit/*` | move | Audit and auth event writes become a shared business module. |
| `cmd/scapi/internal/onboardingsvc/*` | `modules/admin/tenantmanagement/*` | move | Tenant onboarding, sandbox/dedicated DB provisioning, and plan upgrades belong to admin control plane. |
| `cmd/scapi/internal/pingsvc/*` | `modules/tenant/profile/*` | replace | Replace debug ping behavior with real `/profile`. Health probes stay in runtime routes. |
| `cmd/scapi/internal/tenantsvc/service.go` | `internal/platform/tenant/resolver.go` | move | Tenant lookup by host or id, cache, and resolver helpers are platform concerns. |
| `cmd/scapi/internal/tenantsvc/repository.go` | `internal/platform/tenant/repository.go` | move | Master-DB tenant resolution queries stay platform-level. |
| `cmd/scapi/internal/tenantsvc/validator.go` | `internal/platform/tenant/validator.go` | move | Tenant guard and tenant injection are platform middleware concerns. |
| `cmd/scapi/internal/tenantsvc/token_schema.go` | `modules/shared/forms/public_link_token.go` | move | Survey or public-code semantics are business-level, not generic tenant infrastructure. |
| `cmd/scapi/internal/repository/*` | `internal/platform/postgres/*` plus module-local repositories | delete and redistribute | Remove the generic repository package. DB open or tx helpers go to platform, SQL goes into concrete modules. |
| `cmd/scapi/internal/utils/*` | owner packages only | delete and redistribute | Do not keep a runtime `utils` dumping ground. |
| `internal/config/*` | `internal/platform/config/*` | move | Pure platform infrastructure. |
| `internal/logging/*` | `internal/platform/logging/*` | move | Pure platform infrastructure. |
| `internal/hosting/*` | `internal/platform/hosting/*` | move | Pure platform infrastructure. |
| `internal/options/*` | `internal/platform/options/*` | move | Pure platform infrastructure. |
| `internal/httpx/*` | `internal/platform/httpx/*` | move | Pure platform infrastructure. |
| `internal/cors/*` | `internal/platform/httpx/cors/*` or `internal/platform/httpx/middleware/*` | move | Keep CORS close to shared HTTP primitives. |
| `internal/postgres/*` | `internal/platform/postgres/*` | move | Keep client, migrator, instance resolver, and DB helpers together. |
| `internal/notify/*` | `internal/platform/notify/*` | move | Provider adapters and transport-level senders stay platform-level. |
| `internal/auth/jwt_issuer.go`, `jwks.go`, `jwt_claims.go`, `claim_resolver.go`, `otp_generator.go`, `otp_hash.go`, `rate_limiter.go` | `internal/platform/auth/*` | move | These are security and token primitives, not business workflow. |
| `internal/auth/otp_repo.go` | `modules/shared/authentication/repository_pg.go` | move | OTP persistence belongs to the auth business module. |
| `internal/auth/refresh_repo.go` | `modules/shared/sessions/repository_pg.go` | move | Refresh token persistence belongs to session lifecycle. |
| `internal/auth/membership_repo.go` | removed from active contract | remove | Direct tenant auth no longer uses master identity membership lookup. |
| `internal/auth/types.go` | `modules/shared/sessions/model.go` or removed | split or remove | Keep only session and auth types that remain necessary after direct tenant auth. |
| `internal/identity/*` | removed from active contract | remove | Global identity mirror is no longer part of the accepted auth model. |
| `internal/tokencoder/*` | `internal/platform/auth/*` | move | Keep signed token codec as a platform security primitive. |
| `internal/utils/*` | owner packages only | delete and redistribute | Move executable and stack helpers to hosting or errors packages if still needed. |
| `tools/generate_bundle.go` | `tools/` or removed | isolate | Keep tooling outside the runtime package graph. |

## Data domain alignment from MSSQL source tables

`docs/MSSQL` should inform target domain decomposition, not be copied literally.

### `users.sql`

Target direction:

- tenant-local user profile and employment details
- feed `modules/tenant/profile/*`
- direct auth reads email or phone from tenant `users`
- tenant-local user record keeps both business fields and auth-critical flags for the tenant application

### `company.sql` and `companytype.sql`

Target direction:

- admin or shared company directory
- likely `modules/admin/companies/*`
- `companytype` can stay as reference data owned by the same admin module

### `projects.sql` and `projectsaccess.sql`

Target direction:

- tenant project management
- likely `modules/tenant/projects/*`
- `projectsaccess` becomes project membership or project ACL

### `events.sql`

Target direction:

- `modules/shared/audit/*`
- PostgreSQL target table should preserve tenant-aware event logging
- auth runtime must log OTP request success and failure, OTP verify success and failure, token refresh, logout, and rate-limit failures

### `mails.sql`

Target direction:

- business notification evidence and delivery history
- likely `modules/shared/notifications/*`
- platform sender stays under `internal/platform/notify/*`

## Current engine approaches worth preserving

The restructure should preserve these existing strengths:

1. Master database as the source of tenant registry, DB bindings, and plan history.
2. `db_instance`, `tenant`, `tenant_domain`, `tenant_db`, and `tenant_plan_history` as the basis for sandbox and dedicated-database mode.
3. Direct tenant auth without a master identity mirror; master keeps only routing, auth state, and policy surfaces.
4. Tenant resolver by host or tenant id, including in-memory cache.
5. Separate onboarding pools for sandbox and dedicated databases.
6. Shared migrator logic with `migration_runs` tracking in master and `schema_migrations` per tenant DB.
7. Tenant-aware `events` table as the canonical audit/event surface for auth and business activity.

## Target data-boundary rules

### Master database

Master DB should own:

- tenant registry
- tenant domains
- tenant DB bindings
- tenant plan history
- DB instance registry
- admin users
- global identity subjects
- identity to tenant membership
- auth OTP records
- refresh tokens
- migration runs

### Tenant databases

Tenant DBs should own:

- tenant user profile data
- project and project access data
- notification template or tenant-customized message data
- audit or event log data for tenant-visible flows
- future business tables for tenant application modules

### `tenant_id` rule

- In sandbox and shared-database mode, application tables must have `tenant_id`.
- In dedicated-database mode, retaining `tenant_id` is still recommended.
- Do not design tenant application tables that only work when `tenant_id` is absent.
- RLS may be used where useful, but runtime authorization and tenant scoping must still be enforced in Go code.

## Auth and events target rules

### Auth channels

The auth runtime must support:

- email OTP
- phone OTP

### Auth event logging

At minimum, record both success and failure for:

- OTP request
- OTP verify
- refresh token
- logout
- rate limiting
- tenant mismatch or tenant resolution failure where relevant

### Suggested event shape

Keep the PostgreSQL event log close to the current archived shape:

- `tenant_id`
- `user_id`
- `event_type`
- `event_status`
- `channel`
- `address_masked`
- `ip_address`
- `user_agent`
- `error_code`
- `event_data`
- `created_at`

Do not log raw OTP values or unmasked secrets.

## Migration sequence

1. `scapi` is removed. No feature work should reintroduce a combined legacy runtime.
2. Create the new runtime skeleton: `api-tenant`, `api-admin`, `auth`, `worker`, `migrate`.
3. Move platform packages under `internal/platform/*` without changing behavior.
4. Finalize `modules/shared/authentication/*` and `modules/shared/sessions/*`; remove old identity-mirror surfaces.
5. Build `cmd/auth` first and cut OTP flows over to it.
6. Remove migration execution from API startup and move it to `cmd/migrate`.
7. Extract `internal/platform/tenant/*` from `tenantsvc`.
8. Extract `modules/admin/tenantmanagement/*` from `onboardingsvc`.
9. Replace `pingsvc` with `modules/tenant/profile/*` and a real `/profile` endpoint.
10. Extract `modules/shared/audit/*` and `modules/shared/notifications/*`.
11. Add `cmd/worker` jobs for auth cleanup and notification work.
12. `cmd/scapi` has been deleted from the active tree. Remaining work is legacy package cleanup under root `internal/*`.

## Immediate implementation priority

1. `internal/platform/*` move
2. `cmd/auth`
3. direct tenant `users` auth lookup with no master identity mirror
4. `modules/shared/authentication`
5. `modules/shared/sessions`
6. `internal/platform/tenant`
7. `cmd/migrate`
8. `modules/admin/tenantmanagement`
9. `modules/tenant/profile`
10. `modules/tenant/projects`
