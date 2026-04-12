# Auth Runtime Follow-ups

Tracks the remaining frontend rollout work now that backend cookie-based refresh is ready.

## Current Backend State

- tenant auth is live
- admin auth is live
- `/profile` is live for both tenant and admin apps
- `verify` returns only `access_token` and `expires_in`
- refresh token is issued only through `HttpOnly` cookie
- `POST /auth/v1/refresh` is cookie-only
- `POST /auth/v1/logout` is cookie-backed and clears the refresh cookie
- `POST /auth/v1/refresh` and `POST /auth/v1/logout` require allowed `Origin`

## Current Frontend Runtime Behavior

- same-user silent access-token refresh keeps the mounted private shell in place without re-running app bootstrap on every access-token rotation
- private `/app/profile` and admin `/app/me/navigation` revalidation now happens on initial same-user entry, explicit refresh paths, and unauthorized recovery instead of every silent token rotation
- profile and admin-navigation bootstrap calls can retry once after `401` or `403` by asking `auth-core` to recover the access token before forcing sign-out

## Current Frontend Gap

Frontend still needs to align with the backend cookie contract.

Main gaps:

- `auth-core` still stores `refreshToken` in browser storage
- auth client still expects `refresh_token` in verify/refresh JSON
- refresh flow still tries to pass refresh token from JavaScript
- logout client still assumes bearer access token ownership on the auth endpoint
- app bootstrap still needs to ensure private area is gated by real `/profile`

## Required Follow-ups

- remove `refreshToken` from `packages/auth-core/src/auth-storage.ts`
- update `packages/auth-core/src/auth-provider.tsx` to refresh without browser-held refresh token
- update `packages/auth-core/src/otp-auth-service.ts` to use cookie-backed verify/refresh/logout
- update `packages/api-client/src/index.ts` so auth endpoints use `credentials: "include"`
- remove `refresh_token` from frontend auth DTO assumptions
- keep bearer access token only for `/profile` and app API requests
- keep same-site runtime config via `/auth/v1/*` and `/api/v1/*`
- ensure tenant and admin private areas boot only after successful `/profile`

## Integration Notes

- auth requests must go through same-site `/auth/v1/*`
- app API requests must go through same-site `/api/v1/*`
- frontend must not send `tenantId` during login
- frontend must not attempt to read refresh cookie
- frontend must treat missing/expired access token as local state loss and recover through `/auth/v1/refresh`
- if `/auth/v1/refresh` or `/auth/v1/logout` returns `403`, treat it as auth-origin policy failure or invalid browser context

## Handoff Source

Use:

- [`auth-agent-integration-brief.md`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/auth-agent-integration-brief.md)

as the canonical frontend implementation brief.
