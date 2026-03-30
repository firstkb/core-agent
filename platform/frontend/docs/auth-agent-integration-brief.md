# Frontend Auth Integration Brief

Status: current  
Date: 2026-03-30

## Goal

Prepare a safe implementation brief for an AI agent to wire real frontend authentication.

This brief separates:

- what is ready now for `tenant-web`
- what is ready now for `platform-admin-web`
- what must be refactored in shared frontend auth packages before real API wiring

## Decision Summary

Accepted:

- `tenant-web` can move to real OTP auth now
- `tenant-web` can use real `/profile` now
- `platform-admin-web` can move to real OTP auth now
- `platform-admin-web` can use real `/profile` now
- delegated `admin -> tenant` token exchange is explicitly out of scope for this step

Not ready yet:

- delegated `admin -> tenant` token exchange
- admin impersonation
- admin-issued tenant token flow with `role=root` into tenant app

Conclusion:

- implement real auth for both `tenant-web` and `platform-admin-web`
- keep delegated admin-to-tenant access out of this step

## Current Backend Reality

### Ready for `tenant-web`

Auth runtime endpoints:

- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`

Tenant runtime endpoint:

- `GET /profile`

Important backend facts:

- auth reads tenant user data directly from tenant `users`
- login supports email or phone
- auth logs to tenant `events`
- positive auth logs are intentionally minimal: `otp_request` and `login`
- auth failures are logged
- `otp_request` writes the raw OTP code to `events_text`
- `login` writes `OK` to `events_text`
- current token claims include `sub`, `tenant_id`, `email`, `phone`, `level`, `role`, `scope`
- current tenant access scope is `tenant.api`

### Ready for `platform-admin-web`

Auth runtime endpoints:

- `POST /auth/admin/otp/request`
- `POST /auth/admin/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`

Admin runtime endpoint:

- `GET /profile`

Important backend facts:

- admin auth uses `admin_user` from master DB
- admin login supports email and phone when `admin_user.phone` is populated
- current admin access scope is `admin.api`
- current admin role is derived from `admin_user.level`
- current local seed admin user is `admin@platform.local`
- admin auth events are written to master `events`
- positive auth logs are intentionally minimal: `otp_request` and `login`
- auth failures are logged

## Important Frontend Gaps

These are the real blockers in the frontend codebase before real tenant auth can be wired.

### `auth-core` still assumes `idToken`

Current shared auth storage and provider require:

- `accessToken`
- `idToken`
- `refreshToken`

But current backend returns only:

- `access_token`
- `refresh_token`
- `expires_in`

Required refactor:

- stop requiring `idToken`
- derive current user id from `accessToken.sub`
- allow `idToken` to be absent
- keep one auth state source only

### frontend still uses mock auth service

Current apps still use:

- [`packages/auth-core/src/mock-auth-service.ts`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/mock-auth-service.ts)

Both apps still use mock-only behavior through:

- [`packages/auth-core/src/auth-provider.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/auth-provider.tsx)

### private area still uses timeout gate

Both apps still gate the private area with a fake timeout in:

- [`apps/tenant-web/src/app/app.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx)
- [`apps/platform-admin-web/src/app/app.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/src/app/app.tsx)

For `tenant-web` this must be replaced with real `/profile`.

For `platform-admin-web` the same fake timeout must also be replaced with real `/profile`.

## Browser And Gateway Rules

The browser must not send trusted headers.

Meaning:

- browser calls must use bearer token flow
- local direct browser development against `api-tenant` requires bearer mode
- local direct browser development against `api-admin` also requires bearer mode

Production target remains:

- browser sends bearer token to AWS API Gateway
- gateway validates JWT
- downstream backend may use verified claims or trusted headers according to deployment shape

## Local Dev Prerequisite

Do not hardcode URLs in app code.

Read runtime config from:

- [`apps/tenant-web/public/config.json`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/public/config.json)
- [`apps/platform-admin-web/public/config.json`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/public/config.json)

Important mismatch to verify before integration:

- current frontend `config.json` examples point to `3000 / 3100 / 3200`
- current backend local env examples expose `api-tenant=:8080`, `api-admin=:8081`, `auth=:8082`

For real tenant-browser auth in local mode, `api-tenant` must run with bearer validation, not `trusted_headers`.

For real admin-browser auth in local mode, use:

- [`platform/backend/env/api-admin.local-bearer.env`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/env/api-admin.local-bearer.env)

## Backend Contracts To Use

### `POST /auth/otp/request`

Request:

- email flow: `{ "email": "owner@demo.local" }`
- phone flow: `{ "phone": "+1555000202" }`

Success envelope:

```json
{
  "status": "ok",
  "data": {
    "status": "ok"
  }
}
```

### `POST /auth/otp/verify`

Request:

- email flow: `{ "email": "owner@demo.local", "code": "999999" }`
- phone flow: `{ "phone": "+1555000202", "code": "999999" }`

Success envelope:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...jwt...",
    "refresh_token": "...opaque...",
    "expires_in": 900
  }
}
```

### `POST /auth/refresh`

Request headers:

- `Authorization: Bearer <access_token>`

Request body:

```json
{
  "refresh_token": "..."
}
```

Important:

- current refresh endpoint is secure
- the frontend must refresh before access token expiry
- do not rely on refresh after the access token is already expired

### `POST /auth/logout`

Request headers:

- `Authorization: Bearer <access_token>`

Request body:

```json
{
  "all_devices": true
}
```

### `GET /profile` for tenant app

Request headers:

- `Authorization: Bearer <access_token>`

Success envelope:

```json
{
  "status": "ok",
  "data": {
    "user": {
      "id": "uuid",
      "email": "owner@demo.local",
      "level": 90,
      "role": "owner"
    },
    "tenant": {
      "id": "101",
      "host": "demo.platform.local",
      "plan": "demo",
      "status": "active"
    }
  }
}
```

### `POST /auth/admin/otp/request`

Request:

- email flow: `{ "email": "admin@platform.local" }`
- phone flow: `{ "phone": "+1555000001" }`

Success envelope:

```json
{
  "status": "ok",
  "data": {
    "status": "ok"
  }
}
```

### `POST /auth/admin/otp/verify`

Request:

- email flow: `{ "email": "admin@platform.local", "code": "999999" }`
- phone flow: `{ "phone": "+1555000001", "code": "999999" }`

Success envelope:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...jwt...",
    "refresh_token": "...opaque...",
    "expires_in": 900
  }
}
```

Important admin token facts:

- `scope = admin.api`
- `role = root` for the seeded local admin
- `level = 100` for the seeded local admin
- admin token does not carry `tenant_id`

### `GET /profile` for admin app

Request headers:

- `Authorization: Bearer <access_token>`

Success envelope:

```json
{
  "status": "ok",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@platform.local",
      "phone": "+1555000001",
      "name": "Local Platform Admin",
      "level": 100,
      "role": "root",
      "status": "active",
      "scope": "admin.api"
    }
  }
}
```

## Required Implementation Scope For The AI Agent

### Scope A: refactor shared auth core

Target files:

- [`packages/auth-core/src/auth-storage.ts`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/auth-storage.ts)
- [`packages/auth-core/src/auth-provider.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/auth-provider.tsx)
- [`packages/auth-core/src/mock-auth-service.ts`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/mock-auth-service.ts)

Required changes:

- make `idToken` optional or remove it from the required storage contract
- derive current user id from `accessToken.sub`
- persist `expiresAt` or equivalent derived expiry metadata
- add real `refresh()` support
- make `signOut()` call remote logout before clearing storage
- keep the provider as the only auth state owner

Do not:

- add a second auth context
- store duplicate profile state inside `auth-core`

### Scope B: create typed API clients

Target package:

- [`packages/api-client`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/api-client)

Required clients:

- `createAuthClient(baseUrl)`
- `createTenantProfileClient(baseUrl)`
- `createAdminProfileClient(baseUrl)`

Client requirements:

- decode the backend envelope `{ status, data, code, message }`
- throw typed or normalized errors on non-OK responses
- add bearer token where required
- never call raw `fetch` from app pages for auth/profile flows

### Scope C: wire real auth into `tenant-web`

Target files:

- [`apps/tenant-web/src/app/root.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/root.tsx)
- [`apps/tenant-web/src/app/app.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx)

Required behavior:

- read `authApiUrl` and `tenantApiUrl` from persisted runtime config
- inject a real auth service into `AuthProvider`
- keep email and phone login options
- replace the fake private-area timeout with a real `/profile` bootstrap
- enter the private area only after `/profile` succeeds
- on `/profile` failure caused by invalid session, clear auth and redirect to sign-in

### Scope D: wire real auth into `platform-admin-web`

Target files:

- [`apps/platform-admin-web/src/app/root.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/src/app/root.tsx)
- [`apps/platform-admin-web/src/app/app.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/src/app/app.tsx)

Required behavior:

- reuse the same shared auth-core contract after the refactor
- read `authApiUrl` and `adminApiUrl` from persisted runtime config
- call `POST /auth/admin/otp/request` and `POST /auth/admin/otp/verify`
- replace the fake private-area timeout with a real admin `/profile` bootstrap
- enter the private area only after `/profile` succeeds
- on `/profile` failure caused by invalid session, clear auth and redirect to sign-in
- keep the private-area gate structure so the real backend can replace it later with minimal churn

## Explicit Out Of Scope

Do not implement in this step:

- delegated `admin -> tenant` token exchange
- admin impersonation
- trusted-header browser logic
- tenant root access from admin app

## Acceptance Criteria

### Must pass for `tenant-web`

- OTP request works against real auth backend
- OTP verify stores real backend tokens
- `/profile` is used instead of the fake timeout
- refresh is implemented and runs before access token expiry
- logout calls backend and clears local session
- the app does not require `idToken`

### Must remain true for `platform-admin-web`

- OTP request works against real admin auth backend
- OTP verify stores real backend tokens
- `/profile` is used instead of the fake timeout
- refresh is implemented and runs before access token expiry
- logout calls backend and clears local session

## Recommended Work Order

1. Refactor `auth-core` token model away from required `idToken`
2. Land typed auth and profile clients in `packages/api-client`
3. Switch `tenant-web` to the real auth service
4. Replace tenant fake profile timeout with real `/profile`
5. Switch `platform-admin-web` to real admin auth and real admin `/profile`
