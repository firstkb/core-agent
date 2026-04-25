# Auth And Session

Status: active compact module pack
Owner surface: auth/session product domain, cross-stack FE/BE
Last compacted: 2026-04-25

## Read This When

- changing OTP, login, refresh, logout, JWT, JWKS, or auth cookies
- touching `/auth/*`, `/app/profile`, or `/app/me/navigation`
- changing `packages/auth-core` or `packages/api-client`
- changing frontend private-shell bootstrap or recovery behavior

## Owner Sources

- `platform/docs/ai/modules/auth-and-session.md`
- `platform/frontend/docs/contracts/auth-runtime.md`
- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/auth/auth-key-source-configuration.md`

## Fast Facts

- Refresh token is cookie-backed and `HttpOnly`.
- Frontend must not read or store refresh token in JavaScript.
- Auth endpoints use `credentials: "include"`.
- Frontend stores access token and expiry.
- Tenant resolution happens on the backend from trusted browser context, not client-supplied tenant input.
- `/app/profile` owns authenticated profile bootstrap.
- `GET /app/me/navigation` owns admin navigation.
- Prefer new contract-first auth docs over old compatibility pointer paths.

## Local Read Path

1. `contract.md`
2. `state.md`
3. `lessons.md`
4. exact owner source docs only if implementation detail is needed
