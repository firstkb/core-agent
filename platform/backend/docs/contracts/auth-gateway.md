# Backend Auth Gateway Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: backend-issued JWT, JWKS, cookie refresh, and API gateway authorization boundary

This contract defines the backend auth gateway model used by `cmd/auth`, `cmd/api-tenant`, and `cmd/api-admin`.

Read with:

- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`
- `platform/backend/docs/proposals/kms-signing.md` only for future KMS signer work

## Fixed Decisions

- The platform does not use Cognito for backend auth.
- `cmd/auth` issues self-issued RSA access tokens and refresh tokens.
- `cmd/auth` publishes JWKS for public-key validation.
- `cmd/api-tenant` and `cmd/api-admin` target AWS API Gateway JWT authorizers.
- Lambda authorizers are not part of the target baseline.
- Public OTP routes do not require JWT authorization.
- Refresh and logout use cookie-backed refresh token transport.

## Current Runtime Surfaces

Auth runtime:

- `platform/backend/cmd/auth`

Shared auth/session modules:

- `platform/backend/modules/shared/authentication`
- `platform/backend/modules/shared/sessions`

JWT/platform primitives:

- `platform/backend/internal/platform/auth`

## Auth Routes

Tenant auth:

- `POST /auth/otp/request`
- `POST /auth/otp/verify`

Admin auth:

- `POST /auth/admin/otp/request`
- `POST /auth/admin/otp/verify`

Shared session routes:

- `POST /auth/refresh`
- `POST /auth/logout`

JWKS routes:

- `GET /.well-known/jwks.json`
- `GET /auth/jwks.json`

## Refresh Cookie Contract

Default refresh cookie behavior:

- cookie name: `platform_rt`
- cookie path: `/auth/`
- `HttpOnly`: true
- `SameSite`: `Lax` by default
- `Secure`: automatic based on HTTPS unless configured otherwise

Runtime requirements:

- OTP verify writes the refresh cookie and returns only access-token JSON.
- Refresh reads the refresh cookie, rotates the refresh token, and writes a replacement cookie.
- Logout reads the refresh cookie, revokes backend session state, and clears the cookie.
- Refresh and logout require an allowed `Origin`.

Frontend requirements are defined in `platform/frontend/docs/contracts/auth-runtime.md`.

## Access Token Contract

Access tokens must be RSA-signed and must contain a stable JWT header `kid`.

Required baseline claims:

- `iss`
- `aud`
- `sub`
- `iat`
- `nbf`
- `exp`
- `jti`
- `tenant_id`
- `level`
- one contact claim: `email` or `phone`

Recommended business claims:

- `role`
- `scope`

Current runtime-entry scopes:

- `tenant.api`
- `admin.api`

Do not start with per-endpoint or CRUD-shaped scopes.
Introduce narrower scopes only after route ownership and module boundaries are stable.

## Gateway Boundary

- `api-tenant` and `api-admin` should trust requests only from AWS API Gateway or another explicitly trusted edge.
- Production ingress should not expose API runtimes directly to the public internet.
- JWT authorization decisions for tenant or admin routes should happen at API Gateway first.
- Backend business code should rely on trusted token claims or trusted edge-injected claims, not on user-supplied tenant ids.

## Trusted Header Contract

If API Gateway projects validated claims to API runtimes, use these headers:

- `X-Auth-Tenant-Id`
- `X-Auth-User-Id`
- `X-Auth-Email`
- `X-Auth-Phone`
- `X-Auth-Level`
- `X-Auth-Role`
- `X-Auth-Scope`

Runtime rules:

- require `X-Auth-Tenant-Id`
- require `X-Auth-User-Id`
- require `X-Auth-Level`
- require at least one of `X-Auth-Email` or `X-Auth-Phone`
- prefer trusted headers for gateway-integrated API runtimes
- keep bearer token validation for local development or explicit compatibility mode

## Out Of Scope

- Cognito-specific claims
- Lambda authorizer baseline
- browser-origin trusted header flow
- delegated tenant root exchange as part of normal frontend login
