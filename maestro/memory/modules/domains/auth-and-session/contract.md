# Auth And Session Contract

Status: active compact contract

## Invariants

- Refresh token is cookie-backed and `HttpOnly`.
- JavaScript must not read or persist refresh tokens.
- Frontend auth calls must send `credentials: "include"`.
- Frontend stores only access token and expiry for runtime-authenticated requests.
- Frontend must not send `tenantId` during login.
- Tenant resolution belongs to backend trusted runtime context.
- `/app/profile` is profile bootstrap, not navigation.
- Admin navigation comes from `GET /app/me/navigation`.
- Admin and tenant auth behavior should stay aligned unless a divergence is explicitly approved.

## Endpoint Families

Tenant auth:

- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`
- profile exposed to frontend through `/app/profile`

Admin auth:

- `POST /auth/admin/otp/request`
- `POST /auth/admin/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`
- profile exposed to frontend through `/app/profile`
- navigation through `GET /app/me/navigation`

## Backend Surfaces

- `platform/backend/cmd/auth`
- `platform/backend/modules/shared/authentication`
- `platform/backend/modules/shared/sessions`
- `platform/backend/modules/admin/profile`
- `platform/backend/modules/tenant/profile`
- `platform/backend/internal/platform/auth`

## Frontend Surfaces

- `platform/frontend/packages/auth-core`
- `platform/frontend/packages/api-client`
- `platform/frontend/apps/platform-admin-web/src/app/*`
- `platform/frontend/apps/tenant-web/src/app/*`

