# Backend Auth Gateway Contract

Status: active design baseline
Scope: self-issued JWT contract for `auth`, `api-tenant`, and future `api-admin`
Date: 2026-03-29

## Fixed decisions

- `api-tenant` and `api-admin` are expected to run behind AWS API Gateway.
- AWS API Gateway JWT authorizers are the target authorization boundary for tenant and admin APIs.
- Lambda authorizers are not part of the target baseline.
- The platform does not use Cognito for this backend.
- The `auth` runtime issues and rotates self-issued access tokens and refresh tokens.
- The `auth` runtime must publish JWKS for public-key validation.
- The `auth` runtime can also sit behind AWS API Gateway, but its public OTP routes do not require JWT authorization.

## Token contract required by API Gateway

Access tokens must be RSA-signed and must contain a stable JWT header `kid`.

Required claims baseline:

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

Current active direction:

- access tokens from the current auth flow carry `scope=tenant.api`
- future admin flows should carry `scope=admin.api`

## Minimal scope model

Keep the first scope model intentionally small.

Runtime-entry scopes:

- `tenant.api`
- `admin.api`

Do not start with per-endpoint or CRUD-shaped scopes.

Introduce narrower scopes only after:

- `api-admin` exists
- route ownership is stable
- module boundaries are fixed

Possible later extension:

- `tenant.profile.read`
- `tenant.projects.read`
- `tenant.projects.write`
- `admin.tenants.read`
- `admin.tenants.write`

## Boundary rules for tenant and admin APIs

- `api-tenant` and `api-admin` should trust requests only from AWS API Gateway or another explicitly trusted edge.
- Production ingress should not expose these runtimes directly to the public internet.
- Backend business code should rely on trusted token claims or trusted edge-injected claims, not on user-supplied tenant ids.
- JWT authorization decisions for tenant or admin routes should happen at API Gateway first.

## Runtime behavior assumptions

### `auth`

- public OTP routes remain unauthenticated
- refresh and logout can still use local JWT validation if needed
- JWKS must stay public and stable

### `api-tenant`

- the access token is expected to be validated by API Gateway before the request reaches the runtime
- local signature validation is optional and should remain a compatibility or local-development mode only
- preferred integration mode is trusted custom headers projected from validated gateway claims

### `api-admin`

- same gateway-first validation model as `api-tenant`
- admin-only scopes must be distinct from tenant scopes

## Gateway integration notes

- API Gateway JWT authorizers should be configured with this service as the issuer and with the expected audience for the runtime
- route `authorizationScopes` should use runtime-entry scopes first
- API Gateway parameter mapping should use custom headers for trusted projected claims if backend-side claim projection is introduced later
- do not plan on rewriting the `Authorization` header as part of gateway parameter mapping
- if stronger backend hardening is needed later, API Gateway can project validated claims into custom integration headers
- do not base future design on Cognito-specific claim shapes

## Trusted Header Contract

If API Gateway projects validated claims to tenant or admin runtimes, use these headers:

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
- prefer `token.source=trusted_headers` for `api-tenant` and future `api-admin`
- keep `token.source=bearer` for local development or compatibility mode
