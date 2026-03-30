# Auth Runtime Follow-ups

Tracks frontend runtime work that is intentionally mocked today so the future API integration is not forgotten.

## Current State

- `platform-admin-web` bootstraps shared runtime config from `/config.json` in `apps/platform-admin-web/src/app/root.tsx`.
- `tenant-web` bootstraps shared runtime config from `/config.json` and tenant branding from `/tenant/config.json` in `apps/tenant-web/src/app/root.tsx`.
- both apps still use a temporary `setTimeout(..., 650)` gate in `src/app/app.tsx` before entering the private area
- auth state is currently backed by the mock service in `packages/auth-core`
- current frontend auth storage still incorrectly requires `idToken`, while backend returns only `access_token` and `refresh_token`
- current real backend support exists for both tenant auth/profile and admin auth/profile

## Required Follow-ups

- replace the admin private-area delay in `apps/platform-admin-web/src/app/app.tsx` with a real authenticated `/profile` request
- replace the tenant private-area delay in `apps/tenant-web/src/app/app.tsx` with a real authenticated `/profile` request
- keep the private-area gate in place until `/profile` resolves; do not bypass it once API work starts
- while the API is unavailable, keep an explicit mock profile bootstrap so the contract stays visible in code
- land the typed profile client in `packages/api-client` instead of calling `fetch` ad hoc from app code
- ensure the future profile bootstrap reads API base URLs only after runtime config has been persisted from `root.tsx`
- for the concrete implementation plan, use `docs/auth-agent-integration-brief.md`

## Integration Notes

- admin flow depends on `/config.json` being loaded before auth/profile bootstrap
- tenant flow depends on both `/config.json` and `/tenant/config.json` being loaded before auth/profile bootstrap
- `useAuth()` already exposes restored auth state and tokens; the future `/profile` client should build on that instead of introducing a second auth source
