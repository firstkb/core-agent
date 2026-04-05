# Module Memory — Auth And Session

Status: active
Date: 2026-04-05

## Read this when

- changing OTP flows
- touching `/auth/*`, `/app/profile`, or `/app/me/navigation`
- changing cookie or token behavior
- touching `packages/auth-core` or `packages/api-client`
- changing JWKS or JWT validation behavior

## Confirmed backend surfaces

- `platform/backend/cmd/auth`
- `platform/backend/modules/shared/authentication`
- `platform/backend/modules/shared/sessions`
- `platform/backend/modules/admin/profile`
- `platform/backend/modules/tenant/profile`
- `platform/backend/internal/platform/auth`

## Confirmed frontend surfaces

- `platform/frontend/packages/auth-core`
- `platform/frontend/packages/api-client`
- `platform/frontend/apps/platform-admin-web/src/app/*`
- `platform/frontend/apps/tenant-web/src/app/*`

## Locked invariants

- refresh token is cookie-backed and `HttpOnly`
- frontend must not read or store refresh token in JavaScript
- auth endpoints must use `credentials: "include"`
- frontend keeps access token only for runtime-authenticated requests
- frontend must not send `tenantId` during login
- tenant resolution happens on backend from trusted browser context (`Origin` / `Host`), not from arbitrary client-supplied tenant input
- `/app/profile` remains the authenticated profile bootstrap endpoint
- admin navigation is separate and comes from `/app/me/navigation`

## Current endpoint shape

### Tenant auth

- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /profile` on backend runtime side, exposed to frontend through `/app/profile`

### Admin auth

- `POST /auth/admin/otp/request`
- `POST /auth/admin/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /profile` on backend runtime side, exposed to frontend through `/app/profile`
- `GET /app/me/navigation` for admin shell navigation

## Current alignment snapshot

Confirmed in code:

- `packages/api-client` already sends `credentials: "include"` for auth endpoints
- `packages/auth-core` stores access token and expiry
- `packages/auth-core` still clears a legacy `refreshToken` key during cleanup, but the active stored session shape is access-token only

## Important docs

- `platform/frontend/docs/auth-agent-integration-brief.md`
- `platform/frontend/docs/auth-runtime-followups.md`
- `platform/backend/docs/backend-auth-gateway-contract.md`
- `platform/backend/docs/auth/auth-key-source-configuration.md`
- `platform/backend/docs/local-backend-bootstrap.md`

## Common failure modes

- frontend expects `refresh_token` in response JSON
- frontend does not send `credentials: "include"`
- `/profile` and `/app/me/navigation` responsibilities get mixed
- tenant context is pushed from frontend instead of resolved on backend
- admin and tenant auth contracts drift apart unnecessarily
- local docs use stale absolute links and mislead new implementation work

## When to update memory

Update this file when:

- endpoint contracts change
- cookie policy changes
- profile bootstrap order changes
- admin/tenant auth behavior diverges on purpose
