# Frontend Auth Runtime

Status: active compact frontend pack
Owner surface: frontend auth shell
Last compacted: 2026-04-24

## Read This When

- changing `auth-core`
- changing frontend bootstrap, private shells, profile recovery, or same-user refresh behavior
- changing `api-client` credential behavior

## Owner Sources

- `maestro/memory/modules/domains/auth-and-session/`
- `platform/frontend/docs/contracts/auth-runtime.md`
- `platform/frontend/docs/modules/tenant-web.md`
- `platform/frontend/docs/modules/platform-admin-web.md`
- `platform/frontend/packages/auth-core`
- `platform/frontend/packages/api-client`

## Frontend Contract

- Auth endpoints use `credentials: "include"`.
- Refresh token is not JS state.
- Active stored session shape is access token plus expiry.
- Private shells should preserve mounted profile/navigation state during same-user silent access-token refresh.
- Bootstrap revalidation should not run on every same-user access-token rotation.
- Profile/bootstrap calls can retry once after `401`/`403` through `auth-core` recovery before sign-out.

## Risks

- Loader loops can return if stalled refresh/profile calls have no timeout/recovery path.
- Frontend can accidentally reintroduce refresh-token storage assumptions.
- Admin and tenant shells can diverge if app-local fixes are not reflected in shared `auth-core`.
