# Frontend Auth Integration Brief

Status: current  
Date: 2026-03-30

## Goal

Prepare the frontend rollout for the current backend auth contract.

The target implementation is:

- real OTP auth for `tenant-web`
- real OTP auth for `platform-admin-web`
- access token stored in browser runtime
- refresh token never stored in JavaScript
- refresh and logout performed through cookie-backed auth endpoints

## Decision Summary

Accepted:

- both apps must use the real backend auth flow now
- refresh token is backend-managed and lives only in `HttpOnly` cookie
- frontend must use `credentials: "include"` for auth endpoints
- frontend must keep bearer access token for `/profile` and app API calls
- delegated `admin -> tenant` access remains out of scope

Not in scope:

- admin impersonation
- delegated admin-to-tenant ticket flow
- trusted-header browser flow
- a second frontend auth context

## Current Backend Reality

### Tenant app backend surface

Auth endpoints:

- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`

Tenant endpoint:

- `GET /profile`

Important backend facts:

- tenant auth resolves tenant from `Origin` / `Host`
- frontend must not send `tenantId`
- login supports `email` and `phone`
- auth reads tenant user data directly from tenant `users`
- current tenant access scope is `tenant.api`
- auth writes audit events to tenant `events`

### Admin app backend surface

Auth endpoints:

- `POST /auth/admin/otp/request`
- `POST /auth/admin/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`

Admin endpoint:

- `GET /profile`

Important backend facts:

- admin auth uses `admin_user` in master DB
- current admin access scope is `admin.api`
- current local seeded admin is `admin@platform.local`
- current seeded admin token has `role=root` and `level=100`
- admin auth events are written to master `events`

## Browser And Routing Rules

Canonical browser shape:

- `https://admin.platform.local/` -> admin frontend
- `https://admin.platform.local/api/v1/*` -> `api-admin`
- `https://admin.platform.local/auth/v1/*` -> `auth`
- `https://demo.platform.local/` -> tenant frontend
- `https://demo.platform.local/api/v1/*` -> `api-tenant`
- `https://demo.platform.local/auth/v1/*` -> `auth`

Frontend rules:

- do not hardcode backend URLs in app code
- use runtime config only
- use same-site `/auth/v1/*` and `/api/v1/*` paths
- do not send `tenantId` from frontend during login
- do not try to read refresh cookie from JavaScript

Local runtime config should remain:

- tenant app:
  - `authApiUrl = /auth/v1`
  - `tenantApiUrl = /api/v1`
- admin app:
  - `authApiUrl = /auth/v1`
  - `adminApiUrl = /api/v1`

## Current Backend Contracts

### `POST /auth/otp/request`

Request:

- email: `{ "email": "owner@demo.local" }`
- phone: `{ "phone": "+1555000202" }`

Success:

```json
{
  "status": "ok",
  "data": {
    "status": "ok",
    "otp_length": 6
  }
}
```

Notes:

- frontend must size and validate OTP input from `data.otp_length`
- never hardcode OTP length

### `POST /auth/admin/otp/request`

Request:

- email: `{ "email": "admin@platform.local" }`
- phone: `{ "phone": "+1555000001" }`

Success:

```json
{
  "status": "ok",
  "data": {
    "status": "ok",
    "otp_length": 6
  }
}
```

### `POST /auth/otp/verify`

Request:

- email: `{ "email": "owner@demo.local", "code": "9999" }`
- phone: `{ "phone": "+1555000202", "code": "9999" }`

Success:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...jwt...",
    "expires_in": 900
  }
}
```

Response side effects:

- `Set-Cookie` with refresh cookie

Frontend requirements:

- call with `credentials: "include"`
- store only `accessToken` and `expiresAt`
- do not expect `refresh_token` in response JSON

### `POST /auth/admin/otp/verify`

Request:

- email: `{ "email": "admin@platform.local", "code": "999999" }`
- phone: `{ "phone": "+1555000001", "code": "999999" }`

Success:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...jwt...",
    "expires_in": 900
  }
}
```

Response side effects:

- `Set-Cookie` with refresh cookie

Frontend requirements:

- call with `credentials: "include"`
- do not expect `refresh_token` in response JSON

### `POST /auth/refresh`

Request:

- no `Authorization` header required
- no `refresh_token` request body
- browser must send refresh cookie automatically

Success:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...jwt...",
    "expires_in": 900
  }
}
```

Response side effects:

- rotated `Set-Cookie` refresh cookie

Frontend requirements:

- call with `credentials: "include"`
- do not send refresh token from JS
- update only `accessToken` and `expiresAt` on success

Security notes:

- backend rejects missing `Origin`
- backend rejects unapproved `Origin`

### `POST /auth/logout`

Request:

```json
{
  "all_devices": true
}
```

Success:

```json
{
  "status": "ok",
  "data": {
    "status": "ok"
  }
}
```

Response side effects:

- clearing `Set-Cookie`

Frontend requirements:

- call with `credentials: "include"`
- do not require bearer access token for logout
- clear local access-token state even if logout response is already effectively anonymous

### `GET /profile` for tenant app

Request headers:

- `Authorization: Bearer <access_token>`

Success:

```json
{
  "status": "ok",
  "data": {
    "user": {
      "id": "uuid",
      "email": "owner@demo.local",
      "first_name": "Demo",
      "last_name": "Owner",
      "level": 90,
      "role": "owner"
    },
    "tenant": {
      "id": "101",
      "name": "Demo",
      "host": "demo.platform.local",
      "plan": "pro",
      "status": "active"
    }
  }
}
```

### `GET /profile` for admin app

Request headers:

- `Authorization: Bearer <access_token>`

Success:

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

## Required Frontend Changes

### Scope A: refactor `auth-core`

Target files:

- [`packages/auth-core/src/auth-storage.ts`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/auth-storage.ts)
- [`packages/auth-core/src/auth-provider.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/auth-provider.tsx)
- [`packages/auth-core/src/otp-auth-service.ts`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/otp-auth-service.ts)

Required changes:

- remove `refreshToken` from browser storage contract
- keep only:
  - `accessToken`
  - `expiresAt`
- keep deriving current user id from `accessToken.sub`
- refresh flow must no longer require refresh token input from storage
- `signOut()` must call backend logout with cookie flow before clearing local state
- keep a single auth state owner in the provider

Do not:

- add a second auth context
- duplicate auth or profile state

### Scope B: update `api-client`

Target file:

- [`packages/api-client/src/index.ts`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/api-client/src/index.ts)

Required changes:

- `AuthTokenData` must remove `refresh_token`
- auth client methods must use `credentials: "include"`
- `refresh()` must stop accepting `refreshToken`
- `logout()` must stop requiring `accessToken`
- `verifyOtp()` and `verifyAdminOtp()` must accept cookie-based responses
- keep bearer token only for `/profile` and app API clients

Expected auth client shape after refactor:

- `requestOtp(identifier)`
- `requestAdminOtp(identifier)`
- `verifyOtp(input)` with `credentials: "include"`
- `verifyAdminOtp(input)` with `credentials: "include"`
- `refresh()` with `credentials: "include"`
- `logout({ allDevices })` with `credentials: "include"`

### Scope C: update `tenant-web`

Target files:

- [`apps/tenant-web/src/app/root.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/root.tsx)
- [`apps/tenant-web/src/app/app.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx)

Required behavior:

- use runtime config only
- wire auth through cookie-backed auth client
- request OTP and verify OTP with `credentials: "include"`
- keep access token in auth provider state
- replace fake private-area timeout with real `/profile` bootstrap
- refresh access token before expiry through cookie-backed `/auth/refresh`
- on `/profile` failure caused by invalid session:
  - clear local access token state
  - redirect to sign-in

### Scope D: update `platform-admin-web`

Target files:

- [`apps/platform-admin-web/src/app/root.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/src/app/root.tsx)
- [`apps/platform-admin-web/src/app/app.tsx`](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/platform-admin-web/src/app/app.tsx)

Required behavior:

- use runtime config only
- call admin OTP endpoints with `credentials: "include"`
- refresh through cookie-backed `/auth/refresh`
- replace fake private-area timeout with real admin `/profile`
- clear local access token state when session becomes invalid

## Explicit Out Of Scope

Do not implement in this step:

- delegated `admin -> tenant` exchange
- admin impersonation
- trusted-header browser logic
- tenant `root` access from admin app

## Acceptance Criteria

Must be true after frontend rollout:

- browser storage no longer contains `refreshToken`
- all auth endpoints use `credentials: "include"`
- frontend does not send `refresh_token` to backend
- frontend does not send bearer access token to `/auth/refresh`
- OTP verify stores only `accessToken` and `expiresAt`
- tenant app enters private area only after real `/profile`
- admin app enters private area only after real `/profile`
- logout clears local state and backend session
- frontend remains on one shared auth-core contract

## Recommended Work Order

1. Refactor `packages/api-client` auth contract to cookie-backed auth endpoints.
2. Refactor `packages/auth-core` to remove `refreshToken` from storage.
3. Land tenant app on cookie-backed auth + real `/profile`.
4. Land admin app on cookie-backed auth + real `/profile`.
5. Run live browser smoke on:
   - tenant login
   - tenant refresh
   - tenant logout
   - admin login
   - admin refresh
   - admin logout
