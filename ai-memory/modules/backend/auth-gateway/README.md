# Backend Auth Gateway

Status: active compact backend pack
Owner surface: backend auth
Last compacted: 2026-04-25

## Read This When

- changing OTP, refresh/logout, JWKS, JWT validation, profile bootstrap, or auth key configuration

## Owner Sources

- `ai-memory/modules/domains/auth-and-session/`
- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/auth/auth-key-source-configuration.md`
- `platform/backend/cmd/auth`
- `platform/backend/internal/platform/auth`

## Backend Contract

- `cmd/auth` owns OTP auth, refresh/logout, and JWKS.
- API runtimes validate access tokens.
- Refresh token is cookie-backed.
- Tenant login identity is resolved through backend tenant context, not frontend-supplied tenant ids.
- Auth key source behavior must remain explicit and documented.
- Prefer new contract-first auth docs over old compatibility pointer paths.

## Lessons

- Do not reintroduce master identity mirror assumptions unless explicitly approved.
- Do not parse untrusted tenant identity from frontend payloads.
- Do not change token claim names or key source behavior without updating docs and tests.
