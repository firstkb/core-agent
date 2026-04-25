# Backend API Gateway Proxy Routing Policy

Status: future proposal
Last audited: 2026-04-25
Canonical scope: `api-tenant`, `api-admin`

Read with:

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`

This is not the live runtime contract by itself.
Activate it only when gateway deployment work starts.

## Goal

Keep AWS API Gateway stable while backend route count grows.

The gateway should not require a new route entry for every backend endpoint.

Instead, the gateway should expose only two greedy route groups per application API surface:

- one unauthenticated proxy group
- one JWT-gated proxy group

This policy does **not** apply to `auth` in the same way, because `auth` mixes:

- public OTP endpoints
- cookie-backed refresh/logout
- JWKS
- future delegated flows

`auth` should keep explicit route handling.

## Fixed decision

For `api-tenant` and `api-admin`, API Gateway may use two greedy proxy routes and forward all deeper paths to the target service.

The backend service remains the owner of:

- concrete route definitions
- business authorization rules
- tenant boundary checks
- request validation

The gateway owns:

- JWT validation on the secure proxy group
- stable edge routing

## Recommended proxy groups

The first idea was:

- `public/{proxy+}`
- `private/{proxy+}`

That works technically, but the names are too explicit and unpleasant as public URL structure.

## Naming recommendation

Do not rely on hidden naming for security.

Security must come from:

- API Gateway JWT validation
- private integration/network boundary
- backend authorization checks

If explicit `public/private` names are undesirable, use neutral operational prefixes instead.

Recommended names:

- `open/{proxy+}` -> no JWT validation
- `app/{proxy+}` -> JWT validation required

Why this pair:

- `open` is readable and means unauthenticated entry
- `app` reads like normal application traffic instead of `private`
- both are short
- both still communicate intent to operators

Alternative acceptable pair if shorter naming is needed:

- `o/{proxy+}`
- `a/{proxy+}`

This is acceptable only if the team documents it clearly. It must not be treated as a security measure.

## Routing model

### Admin API Gateway surface

- `open/{proxy+}` -> passthrough to `api-admin`, no JWT validation
- `app/{proxy+}` -> passthrough to `api-admin`, JWT validation required

### Tenant API Gateway surface

- `open/{proxy+}` -> passthrough to `api-tenant`, no JWT validation
- `app/{proxy+}` -> passthrough to `api-tenant`, JWT validation required

## Path handling rule

The backend should own canonical application route families directly.

Secure application routes should live under `/app/...`.

Examples already aligned in `api-admin`:

- backend route is `/app/profile`
- backend route is `/app/admin/tenants`

If public application routes are introduced later, they should follow the same rule under `/open/...`.

API Gateway integration should therefore preserve the canonical backend path instead of stripping the prefix away.

Example:

- public URL: `/app/profile`
- backend receives: `/app/profile`

- public URL: `/app/admin/tenants`
- backend receives: `/app/admin/tenants`

Only temporary migration bridges should rewrite between edge and backend paths.

## Validation policy

### At API Gateway

For the secure proxy group:

- validate JWT using JWKS from `auth`
- validate `iss`
- validate `aud`
- validate required entry scope

Entry scopes remain intentionally small:

- `tenant.api`
- `admin.api`

### At backend service

`api-tenant` and `api-admin` should still enforce:

- route tier expectations
- claim presence
- role/level/scope-based authorization
- tenant host/boundary rules where applicable

## Do backend services still need to validate JWT signatures?

### Recommended target

Production target:

- API Gateway is the primary JWT validation boundary
- `api-tenant` and `api-admin` accept only traffic from trusted API Gateway/private integration
- backend services may run in trusted-header mode instead of local bearer signature validation

This means:

- **yes**, token validation is required in the platform
- **no**, the long-term production target does not require duplicated full JWT signature validation inside every app service

### What must still be checked in backend

Even in trusted-header mode, backend services must still validate:

- required projected auth headers
- scope compatibility with the target API
- role/level authorization
- tenant host/tenant context consistency

### Local development and compatibility mode

Keep local bearer validation support for:

- local dev
- direct service testing
- compatibility fallback

So the practical rule is:

- production target: gateway-first validation, backend trusted-header enforcement
- local/dev fallback: backend bearer validation can stay enabled

## Why not depend only on backend validation?

Because the edge should reject invalid or mis-scoped tokens before the request reaches the runtime.

Benefits:

- fewer invalid requests hit the service
- cleaner separation between ingress auth and business logic
- simpler API Gateway growth model
- easier JWKS-based integration without Lambda authorizers

## Why not obfuscate the route names more aggressively?

Because obscurity does not materially improve security here.

If the URL is public, clients can still discover it.

The real controls are:

- JWT validation
- scopes
- backend authorization
- private network integration

Therefore route names should be:

- stable
- short
- operationally clear

not "secret".

## Rollout recommendation

1. Keep backend service routes unchanged.
2. Add two greedy API Gateway route groups for `api-tenant`.
3. Add two greedy API Gateway route groups for `api-admin`.
4. Configure JWT validation only on the secure proxy group.
5. Keep backend bearer validation in local/transition mode.
6. Move production `api-tenant` and `api-admin` to trusted-header mode only after gateway/private integration is confirmed.

## Non-goals

- This policy does not rename current backend routes.
- This policy does not change `auth` endpoint structure.
- This policy does not replace backend authorization checks.
