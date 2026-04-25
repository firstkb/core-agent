# Frontend Auth Runtime Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: frontend auth runtime, cookie refresh, profile bootstrap, and app auth client behavior

This contract defines how frontend apps integrate with the backend auth runtime.
It replaces the old frontend auth implementation brief as the active frontend auth contract.

## Core Invariants

- Refresh token is backend-managed and stored only in an `HttpOnly` cookie.
- JavaScript must not read, store, or send refresh tokens.
- Frontend auth calls must use `credentials: "include"`.
- Frontend stores only `accessToken` and `expiresAt`.
- Bearer access token is used for `/app/profile`, `/app/me/navigation`, and app API requests, not for refresh-token transport.
- Frontend must not send `tenantId` during login.
- Tenant resolution belongs to backend trusted browser context and host/origin handling.
- Admin and tenant auth must stay aligned unless a divergence is explicitly approved.

## Browser Routing

Canonical browser-facing paths:

- Admin frontend: `https://admin.platform.local/`
- Admin API: `https://admin.platform.local/api/v1/*`
- Admin auth: `https://admin.platform.local/auth/v1/*`
- Tenant frontend: `https://demo.platform.local/`
- Tenant API: `https://demo.platform.local/api/v1/*`
- Tenant auth: `https://demo.platform.local/auth/v1/*`

Frontend runtime config should use same-site paths:

- `authApiUrl = /auth/v1`
- `tenantApiUrl = /api/v1`
- `adminApiUrl = /api/v1`

Do not hardcode backend service URLs in app code.

## Tenant Auth Flow

Frontend auth endpoints:

- `POST /auth/v1/otp/request`
- `POST /auth/v1/otp/verify`
- `POST /auth/v1/refresh`
- `POST /auth/v1/logout`

Tenant profile endpoint:

- `GET /api/v1/app/profile`

Tenant auth facts:

- login supports email or phone
- backend resolves tenant from trusted host/origin context
- backend reads tenant user data directly from tenant `users`
- current tenant access scope is `tenant.api`
- tenant auth events are written to tenant `events`

## Admin Auth Flow

Frontend auth endpoints:

- `POST /auth/v1/admin/otp/request`
- `POST /auth/v1/admin/otp/verify`
- `POST /auth/v1/refresh`
- `POST /auth/v1/logout`

Admin profile endpoint:

- `GET /api/v1/app/profile`

Admin navigation endpoint:

- `GET /api/v1/app/me/navigation`

Admin auth facts:

- admin auth uses `admin_user` in master DB
- current admin access scope is `admin.api`
- seeded local root admin uses `level=100` and `role=root`
- admin auth events are written to master `events`

## OTP Request

Request shape:

```json
{ "email": "owner@demo.local" }
```

or:

```json
{ "phone": "+1555000202" }
```

Success shape:

```json
{
  "status": "ok",
  "data": {
    "status": "ok",
    "otp_length": 6
  }
}
```

Frontend must size and validate OTP input from `data.otp_length`.
Do not hardcode OTP length.

## OTP Verify

Request shape:

```json
{ "email": "owner@demo.local", "code": "999999" }
```

or:

```json
{ "phone": "+1555000202", "code": "999999" }
```

Success shape:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...jwt...",
    "expires_in": 900
  }
}
```

Response side effect:

- backend sends rotated refresh cookie with `Set-Cookie`

Frontend requirements:

- call with `credentials: "include"`
- store only `accessToken` and `expiresAt`
- do not expect `refresh_token` in response JSON

## Refresh

Request:

- `POST /auth/v1/refresh`
- no request body required
- no `Authorization` header required
- browser sends refresh cookie automatically

Success shape:

```json
{
  "status": "ok",
  "data": {
    "access_token": "...jwt...",
    "expires_in": 900
  }
}
```

Response side effect:

- backend rotates refresh token and sends a replacement refresh cookie

Frontend requirements:

- call with `credentials: "include"`
- do not send refresh token from JavaScript
- update only `accessToken` and `expiresAt` on success
- treat `401` or `403` refresh failure as invalid or expired session after recovery policy is exhausted

## Logout

Request:

```json
{ "all_devices": true }
```

Success shape:

```json
{
  "status": "ok",
  "data": {
    "status": "ok"
  }
}
```

Response side effect:

- backend clears refresh cookie

Frontend requirements:

- call with `credentials: "include"`
- do not require bearer access token for logout
- clear local access-token state even if backend session is already anonymous

## Bootstrap Rules

- Tenant private area enters only after real `/app/profile`.
- Admin private area enters only after real `/app/profile`.
- Admin navigation comes from `/app/me/navigation`, not `/app/profile`.
- Profile/navigation bootstrap may retry once after `401` or `403` through auth recovery before forcing sign-out.
- Silent same-user token refresh must not remount private shells or re-run full app bootstrap every rotation.
- Bootstrap-critical auth/profile/navigation requests must time out rather than leaving the shell stuck on session checking.

## Frontend Surfaces

- `platform/frontend/packages/api-client`
- `platform/frontend/packages/auth-core`
- `platform/frontend/apps/tenant-web/src/app`
- `platform/frontend/apps/platform-admin-web/src/app`

## Out Of Scope

- delegated admin-to-tenant exchange
- admin impersonation
- trusted-header browser flow
- a second frontend auth context
- tenant `root` access from admin app without an explicit exchange flow
