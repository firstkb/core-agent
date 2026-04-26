# Backend API Gateway HTTP API Mapping Spec

Status: future proposal
Last audited: 2026-04-25
Canonical scope: AWS API Gateway for `api-tenant` and `api-admin`

Read with:

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/proposals/api-gateway-proxy-routing.md`

This is not the live runtime contract by itself.
Activate it only when gateway deployment work starts.

## Goal

Provide a stable AWS API Gateway layout that:

- avoids adding a new gateway route for every backend endpoint
- validates access tokens at the edge for secure application traffic
- keeps backend service route families explicit and canonical
- supports trusted-header mode for `api-tenant` and `api-admin`

## Fixed gateway model

Each application API surface gets two greedy route groups:

- `ANY /open/{proxy+}`
- `ANY /app/{proxy+}`

Meaning:

- `/open/{proxy+}` = unauthenticated passthrough
- `/app/{proxy+}` = JWT-gated passthrough

These are the accepted application API route families.

Backend services should own their real route paths inside those families, for example:

- `/app/profile`
- `/app/admin/tenants`

For public application routes introduced later, the same rule should apply under `/open/...`.

## Route groups to create

### Tenant API

Custom domain example:

- `https://demo.platform.example`

Create:

- `ANY /open/{proxy+}` -> integration target `api-tenant`
- `ANY /app/{proxy+}` -> integration target `api-tenant`

JWT:

- attach JWT authorizer only to `ANY /app/{proxy+}`
- required route scope: `tenant.api`

### Admin API

Custom domain example:

- `https://admin.platform.example`

Create:

- `ANY /open/{proxy+}` -> integration target `api-admin`
- `ANY /app/{proxy+}` -> integration target `api-admin`

JWT:

- attach JWT authorizer only to `ANY /app/{proxy+}`
- required route scope: `admin.api`

## Integration path handling

For both `open` and `app` route groups, preserve the canonical backend path family.

Target behavior:

- public request: `/app/profile`
- backend receives: `/app/profile`

- public request: `/app/admin/tenants`
- backend receives: `/app/admin/tenants`

The exact API Gateway expression depends on the integration configuration style, but the operational requirement is fixed:

- preserve the application route family (`/app/...` or `/open/...`)
- preserve the rest of the path verbatim
- use rewriting only as a temporary migration bridge for legacy paths

## JWT authorizer settings

Use AWS API Gateway HTTP API JWT authorizer for the `app/{proxy+}` routes.

Authorizer settings:

- identity source: `Authorization` header
- issuer: `auth` issuer URL
- audience:
  - tenant app API -> tenant audience used by `auth`
  - admin app API -> admin audience used by `auth`

Required route scopes:

- tenant secure proxy group -> `tenant.api`
- admin secure proxy group -> `admin.api`

## Trusted header projection

For secure proxy routes, project validated claims into backend custom headers.

Use these headers:

- `X-Auth-Tenant-Id`
- `X-Auth-User-Id`
- `X-Auth-Email`
- `X-Auth-Phone`
- `X-Auth-Level`
- `X-Auth-Role`
- `X-Auth-Scope`

These names match the current backend trusted-header contract.

### Tenant `app/{proxy+}` mappings

Project:

- `X-Auth-Tenant-Id` <- `tenant_id`
- `X-Auth-User-Id` <- `sub`
- `X-Auth-Email` <- `email`
- `X-Auth-Phone` <- `phone`
- `X-Auth-Level` <- `level`
- `X-Auth-Role` <- `role`
- `X-Auth-Scope` <- `scope`

### Admin `app/{proxy+}` mappings

Project:

- `X-Auth-User-Id` <- `sub`
- `X-Auth-Email` <- `email`
- `X-Auth-Phone` <- `phone`
- `X-Auth-Level` <- `level`
- `X-Auth-Role` <- `role`
- `X-Auth-Scope` <- `scope`

Do not require `X-Auth-Tenant-Id` on admin secure routes.

That matches current backend behavior for `scope=admin.api`.

## Header overwrite rule

For secure proxy routes, do not append auth headers.

Always overwrite them so caller-supplied spoofed values cannot survive.

Required rule:

- `X-Auth-*` on secure routes must come only from API Gateway validated claims

## Public route header sanitization

For `open/{proxy+}` routes, remove or clear incoming `X-Auth-*` headers before forwarding to backend.

This prevents callers from smuggling trusted-header names to services that run in `trusted_headers` mode.

Minimum list to clear on open routes:

- `X-Auth-Tenant-Id`
- `X-Auth-User-Id`
- `X-Auth-Email`
- `X-Auth-Phone`
- `X-Auth-Level`
- `X-Auth-Role`
- `X-Auth-Scope`

## Current token claim mapping

Current access token claims already support this mapping:

- `sub`
- `tenant_id` for tenant tokens
- `email`
- `phone`
- `level`
- `role`
- `scope`

Current secure scopes:

- tenant tokens -> `tenant.api`
- admin tokens -> `admin.api`

## Backend runtime mode

### Production target

For `api-tenant` and `api-admin`:

- `TOKEN_SOURCE=trusted_headers`

Meaning:

- gateway validates JWT
- gateway projects trusted claim headers
- backend enforces trusted-header contract and business authorization

### Local and compatibility mode

Keep support for:

- `TOKEN_SOURCE=bearer`

Use this for:

- local direct service testing
- transitional rollout
- non-gateway troubleshooting

## Tenant host preservation

Tenant routing and tenant refresh boundary logic still depend on the effective public host.

Current backend route-domain extraction prefers:

- `X-Forwarded-Host`
- `Host`
- `Origin`

Therefore the integration must preserve the public tenant host in a trustworthy way.

Preferred outcome:

- backend still receives the original public host information without extra changes

If API Gateway integration does not preserve it cleanly, add a dedicated trusted host header as a backend follow-up and update tenant route-domain extraction to accept it.

This is important for:

- tenant resolution
- tenant boundary validation

## Auth service

This spec does **not** apply to `auth` in the same two-proxy form.

`auth` should keep explicit route ownership because it mixes:

- public OTP endpoints
- cookie-backed refresh/logout
- JWKS
- future delegated flows

## Current prerequisite gap

Current backend already publishes:

- `/.well-known/jwks.json`

But before final AWS API Gateway rollout, confirm the issuer metadata shape required by the chosen JWT authorizer setup.

If the authorizer requires issuer metadata beyond direct JWKS publication, add the missing discovery endpoint to `auth` before production rollout.

## Rollout order

1. Keep backend routes unchanged.
2. Create the four route groups:
   - tenant `open/{proxy+}`
   - tenant `app/{proxy+}`
   - admin `open/{proxy+}`
   - admin `app/{proxy+}`
3. Configure JWT authorizers only on `app/{proxy+}`.
4. Configure path rewrite so backend paths stay unchanged.
5. Configure trusted header overwrite on `app/{proxy+}`.
6. Configure trusted header removal on `open/{proxy+}`.
7. Move production `api-tenant` and `api-admin` to `trusted_headers` mode.
8. Keep local bearer mode for development and emergency fallback.

## Final recommendation

Use:

- `open/{proxy+}` for unauthenticated app routes
- `app/{proxy+}` for JWT-gated app routes

Do not hide route intent behind obscure names.

Security should come from:

- JWT validation
- scopes
- trusted header overwrite
- backend authorization
- private integration
