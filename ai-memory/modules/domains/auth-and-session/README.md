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

- `platform/frontend/docs/contracts/auth-runtime.md`
- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`
- `platform/backend/docs/proposals/kms-signing.md`

Historical import context lives in `ai-memory/durable/legacy-memory-import.md`; the old `platform/docs/ai/**` path has been deleted.

## Fast Facts

- Refresh token is cookie-backed and `HttpOnly`.
- Frontend must not read or store refresh token in JavaScript.
- Auth endpoints use `credentials: "include"`.
- Frontend stores access token and expiry.
- Tenant resolution happens on the backend from trusted browser context, not client-supplied tenant input.
- `/app/profile` owns authenticated profile bootstrap.
- `GET /app/me/navigation` owns admin navigation.
- Prefer new contract-first auth docs over old compatibility pointer paths.
- KMS signing remains future proposal scope until implementation lands.

## Local Read Path

1. `contract.md`
2. `state.md`
3. `lessons.md`
4. exact owner source docs only if implementation detail is needed
