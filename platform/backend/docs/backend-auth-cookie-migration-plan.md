# Backend Auth Cookie Migration Plan

Status: active working plan  
Date: 2026-03-30

## Goal

Move the auth flow to secure refresh-token storage outside JavaScript runtime while keeping `auth` as a separate backend API.

Target end state:

- browser no longer receives `refresh_token` in JSON
- refresh token exists only in `HttpOnly` cookie
- refresh/logout operate without refresh token in JS
- tenant auth still resolves tenant by `Origin` / `Host`
- admin auth stays separate from tenant auth

## Phase Status

| Phase | Status | Scope |
| --- | --- | --- |
| Phase 0 | completed | Local HTTPS same-site dev stack through Caddy path routing and unified startup script |
| Phase 1 | completed | Master session schema redesign for refresh session families |
| Phase 2 | completed | Session repository redesign: rotation, family revoke, reuse detection |
| Phase 3 | completed | Auth response contract update: remove `refresh_token` from JSON |
| Phase 4 | completed | Verify/refresh/logout HTTP handlers with cookie issuance and clearing |
| Phase 5 | completed | Refresh cookie policy config and runtime wiring |
| Phase 6 | completed | Refresh endpoint reads cookie only and rotates on success |
| Phase 7 | completed | Logout revokes backend session and always clears cookie |
| Phase 8 | completed | Credentialed CORS and CSRF protections for cookie auth |
| Phase 9 | completed | Audit events for session create/rotate/revoke/reuse |
| Phase 10 | completed | Docs and frontend handoff for `credentials: include` flow |

## Phase Detail

### Phase 0

Scope:

- move local browser auth testing to same-site HTTPS paths
- avoid direct browser dependency on `http://127.0.0.1:8080/8081/8082`
- prepare dev topology for `Secure` cookie testing

Target local routing:

- `https://admin.platform.local/` -> admin frontend
- `https://admin.platform.local/api/*` -> `api-admin`
- `https://admin.platform.local/auth/*` -> `auth`
- `https://demo.platform.local/` -> tenant frontend
- `https://demo.platform.local/api/*` -> `api-tenant`
- `https://demo.platform.local/auth/*` -> `auth`
- `https://acme.platform.local/` -> tenant frontend
- `https://acme.platform.local/api/*` -> `api-tenant`
- `https://acme.platform.local/auth/*` -> `auth`

Implementation decisions:

- keep `auth` as a separate backend service, but expose it behind same-site `/auth/*`
- keep app APIs behind same-site `/api/*`
- use relative frontend runtime config:
  - `authApiUrl = /`
  - `adminApiUrl = /api`
  - `tenantApiUrl = /api`
- add a unified local script that starts frontend, backend, and Caddy together

Status notes:

- completed
- Caddy now routes `/api/*` and `/auth/*` per host
- local config defaults now target same-site relative paths
- unified HTTPS dev stack script added
- host set includes `admin.platform.local`, `demo.platform.local`, and `acme.platform.local`
- invalid `handle_path @api` matcher usage was corrected to valid path-stripping routing

Validation:

- `bash -n platform/frontend/scripts/dev-https.sh`
- `bash -n platform/frontend/scripts/dev-proxy.sh`
- `bash -n platform/frontend/scripts/dev-stack-https.sh`
- `caddy validate --config platform/frontend/dev/caddy/Caddyfile --adapter caddyfile`
- result: all three shell syntax checks passed, and `caddy validate` returned `Valid configuration`

Changed files:

- `platform/frontend/dev/caddy/Caddyfile`
- `platform/frontend/dev/caddy/README.md`
- `platform/frontend/scripts/dev-https.sh`
- `platform/frontend/scripts/dev-hosts.sh`
- `platform/frontend/scripts/dev-stack-https.sh`
- `platform/frontend/package.json`
- `platform/frontend/apps/platform-admin-web/public/config.json`
- `platform/frontend/apps/tenant-web/public/config.json`
- `platform/frontend/README.md`

### Phase 1

Scope:

- extend `auth_refresh_token` into a refresh session family model

Target fields:

- `session_id`
- `user_id`
- `surface`
- `tenant_id`
- `refresh_token_hash`
- `token_family_id`
- `expires_at`
- `revoked_at`
- `rotated_at`
- `created_at`
- `updated_at`
- optional: `ip_address`
- optional: `user_agent`

Decision:

- evolve `auth_refresh_token`
- do not create a second parallel refresh-session table unless forced by implementation constraints

Status notes:

- completed
- `auth_refresh_token` now has `session_id`, `surface`, `token_family_id`, `rotated_at`, `updated_at`, `ip_address`, and `user_agent`
- current token issuance writes the new session metadata for both tenant and admin surfaces
- current refresh issuance preserves `session_id` and `token_family_id` continuity
- reuse detection and family-level revoke behavior remain explicitly deferred to Phase 2

Validation:

- `go test ./...`
- `go run ./cmd/migrate --env ./env/migrate.local.env.example`

Changed files:

- `platform/backend/migrations/postgres/master/030_auth_refresh_session_family.sql`
- `platform/backend/modules/shared/sessions/repository_pg.go`
- `platform/backend/modules/shared/sessions/repository_pg_test.go`
- `platform/backend/modules/shared/authentication/helper.go`
- `platform/backend/modules/shared/authentication/service.go`
- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/backend-auth-control-table-design.md`

### Phase 2

Scope:

- redesign repository operations for:
  - token creation
  - rotation
  - family revoke
  - reuse detection
  - cleanup

Decision:

- one row = one issued refresh token version
- one family = one long-lived browser session chain

Status notes:

- completed
- refresh repository now supports `GetTokenRecord`, `RotateToken`, and `RevokeTokenFamily`
- refresh flow now classifies token state as `active`, `expired`, `revoked`, or `rotated`
- successful refresh rotates the current token inside a single transaction and preserves `session_id` plus `token_family_id`
- presenting a rotated token is now treated as refresh-token reuse and revokes the active family members
- browser/API contract is still unchanged in this phase: refresh token remains in JSON and request body until Phase 3 and Phase 4

Validation:

- `go test ./...`

Changed files:

- `platform/backend/modules/shared/sessions/repository_pg.go`
- `platform/backend/modules/shared/sessions/repository_pg_test.go`
- `platform/backend/modules/shared/authentication/service.go`
- `platform/backend/modules/shared/authentication/service_runtime_test.go`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`
- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/backend-auth-control-table-design.md`

### Phase 3

Scope:

- remove `refresh_token` from verify/refresh JSON success bodies

Target success contract:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...",
    "expires_in": 900
  }
}
```

Status notes:

- completed
- public verify and refresh responses now expose only `access_token` and `expires_in`
- refresh token remains available only in the internal `IssuedTokens` service result so Phase 4 can move it into `Set-Cookie` without reworking token issuance again
- this phase intentionally changes the live JSON contract before cookie issuance exists; browser refresh continuity is therefore not restored until Phase 4 and Phase 6 complete

Validation:

- `go test ./...`

Changed files:

- `platform/backend/modules/shared/authentication/model.go`
- `platform/backend/modules/shared/authentication/service.go`
- `platform/backend/modules/shared/authentication/handler.go`
- `platform/backend/modules/shared/authentication/service_runtime_test.go`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Phase 4

Scope:

- implement custom HTTP handling for auth endpoints that need `Set-Cookie`

Reason:

- generic JSON handler is not the right place for cookie issuance/clearing

Status notes:

- completed
- `POST /auth/otp/verify`, `POST /auth/admin/otp/verify`, and `POST /auth/refresh` now use auth-specific HTTP handlers that can set refresh cookies while preserving the existing response envelope
- `POST /auth/logout` now clears the refresh cookie on successful logout response
- refresh cookie settings are currently defaulted in the auth server transport layer: host-only `platform_rt`, `Path=/auth/`, `HttpOnly`, `SameSite=Lax`, and `Secure` when the request is HTTPS or forwarded as HTTPS
- refresh endpoint still reads `refresh_token` from request JSON in this phase; cookie-only request handling remains deferred to Phase 6
- cookie policy is not yet runtime-configurable in this phase; that wiring remains deferred to Phase 5

Validation:

- `go test ./...`

Changed files:

- `platform/backend/cmd/auth/internal/server/auth_cookie.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie_test.go`
- `platform/backend/cmd/auth/internal/server/routes.go`
- `platform/backend/modules/shared/authentication/model.go`
- `platform/backend/modules/shared/authentication/service.go`
- `platform/backend/modules/shared/authentication/handler.go`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Phase 5

Scope:

- add refresh cookie policy config

Target:

- `HttpOnly`
- `Secure`
- `Path=/auth/`
- concise name like `platform_rt`
- `SameSite=Lax` for same-site deployment

Status notes:

- completed
- auth server config now has a runtime `cookie` block with `name`, `path`, `domain`, `samesite`, and `securemode`
- env surface is now:
  - `AUTHAPI_COOKIE_NAME`
  - `AUTHAPI_COOKIE_PATH`
  - `AUTHAPI_COOKIE_DOMAIN`
  - `AUTHAPI_COOKIE_SAMESITE`
  - `AUTHAPI_COOKIE_SECUREMODE`
- policy is normalized at bootstrap with safe defaults:
  - `name=platform_rt`
  - `path=/auth/`
  - `samesite=lax`
  - `securemode=auto`
- `domain` remains optional; empty value means host-only cookie
- `securemode` currently supports `auto`, `always`, and `never`
- `samesite` currently supports `lax`, `strict`, and `none`

Validation:

- `go test ./...`

Changed files:

- `platform/backend/cmd/auth/internal/server/server.go`
- `platform/backend/cmd/auth/internal/server/bootstrap.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie_test.go`
- `platform/backend/env/auth.local.env.example`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Phase 6

Scope:

- `POST /auth/refresh`
- refresh token read from cookie only
- mandatory rotation on success

Status notes:

- completed
- `POST /auth/refresh` no longer reads `refresh_token` from request JSON
- refresh route now reads the token only from the configured refresh cookie name
- refresh route is no longer bearer-protected; it now runs as a public auth route so access-token expiry does not block refresh
- successful refresh continues to rotate the refresh token family and returns a newly rotated `Set-Cookie`
- tenant refresh now validates that the request route domain matches the tenant host associated with the refresh-session record
- missing refresh cookie is now treated as unauthorized rather than invalid input

Validation:

- `go test ./...`

Changed files:

- `platform/backend/modules/shared/authentication/service.go`
- `platform/backend/modules/shared/authentication/service_runtime_test.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie_test.go`
- `platform/backend/cmd/auth/internal/server/routes.go`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Phase 7

Scope:

- `POST /auth/logout`
- revoke backend session/family
- always clear cookie

Status notes:

- completed
- `POST /auth/logout` no longer depends on bearer claims to reach the handler
- logout now reads the refresh token from cookie and revokes backend session state from the refresh-session record
- default logout revokes the current refresh-token family; `all_devices=true` revokes all refresh sessions for the same `tenant_id + user_id`
- logout now clears the refresh cookie on both success and handled error paths, including invalid request JSON
- missing or already-unknown refresh cookies are treated as benign logout completion so browser cleanup can still finish
- tenant logout uses the same route-domain versus tenant-host boundary check as refresh before revoking tenant session state
- positive logout events are now included in auth event logging

Validation:

- `go test ./...`

Changed files:

- `platform/backend/modules/shared/authentication/service.go`
- `platform/backend/modules/shared/authentication/service_runtime_test.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie_test.go`
- `platform/backend/cmd/auth/internal/server/routes.go`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Phase 8

Scope:

- credentialed CORS
- minimum CSRF protection

Required baseline:

- explicit allowed origins only
- `Access-Control-Allow-Credentials: true`
- `Origin` validation on `refresh` and `logout`

Status notes:

- completed
- CORS middleware now emits `Vary: Origin`, `Vary: Access-Control-Request-Method`, and `Vary: Access-Control-Request-Headers`
- shared origin matching is now reusable outside the middleware, so auth transport enforces the same allowed-origin contract as CORS
- cookie-auth endpoints `POST /auth/refresh` and `POST /auth/logout` now require a present and allowed `Origin` header before any session processing
- missing `Origin` is rejected with `AUTH_CSRF_ORIGIN_MISSING`
- invalid `Origin` is rejected with `AUTH_CSRF_ORIGIN_INVALID`
- this phase intentionally stops at strict origin-based protection; a separate CSRF token/header mechanism is still deferred

Validation:

- `go test ./...`

Changed files:

- `platform/backend/internal/platform/httpx/middleware/cors.go`
- `platform/backend/internal/platform/httpx/middleware/cors_test.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie.go`
- `platform/backend/cmd/auth/internal/server/auth_cookie_test.go`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Phase 9

Scope:

- audit:
  - `session_created`
  - `session_rotated`
  - `session_revoked`
  - `session_reuse_detected`

Rule:

- never log token values

Status notes:

- completed
- auth now emits dedicated session lifecycle events in addition to the existing auth success/failure events
- `session_created` is written on successful tenant and admin OTP verify after refresh-session persistence succeeds
- `session_rotated` is written on successful refresh rotation for both tenant and admin sessions
- `session_revoked` is written on successful logout revoke
- `session_reuse_detected` is written whenever a rotated refresh token is presented again and the token family is revoked
- session audit payload includes session/family/user/tenant/surface metadata and expiry, but never includes raw token values or token hashes
- session lifecycle events are now included in the auth event logging filter

Validation:

- `go test ./...`

Changed files:

- `platform/backend/modules/shared/audit/types.go`
- `platform/backend/modules/shared/authentication/service.go`
- `platform/backend/modules/shared/authentication/service_runtime_test.go`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Phase 10

Scope:

- backend docs update
- frontend handoff update

Frontend follow-up expected after backend rollout:

- `fetch(..., { credentials: "include" })`
- remove refresh token from browser storage
- refresh/logout without JS refresh token

Status notes:

- completed
- frontend handoff has been rewritten around the live cookie-based auth contract
- the handoff now explicitly documents:
  - verify returns only `access_token` and `expires_in`
  - refresh token exists only in `HttpOnly` cookie
  - `refresh` is cookie-only and no longer accepts refresh token from JS
  - `logout` is cookie-backed and no longer requires bearer access token
  - auth endpoints must use `credentials: "include"`
  - `/profile` remains bearer access-token based
- follow-up runtime notes now point frontend work at the cookie contract instead of the old body-token refresh model

Validation:

- docs-only update; no additional backend runtime change in this phase

Changed files:

- `platform/frontend/docs/auth-agent-integration-brief.md`
- `platform/frontend/docs/auth-runtime-followups.md`
- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

## Current Recommendation

Do Phase 0 first, then Phase 1 through Phase 4 as the first security-critical backend slice.
