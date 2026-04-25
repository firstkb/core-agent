# Auth And Session State

Status: active compact state

## Landed

- `packages/api-client` sends `credentials: "include"` for auth endpoints.
- `packages/auth-core` stores access token and expiry.
- Bootstrap-critical auth/profile requests time out instead of leaving apps in indefinite session-check loading.
- Refresh lead window scales from access-token lifetime, avoiding immediate post-login refresh loops for short-lived tokens.
- Non-401 refresh failures preserve session hints and avoid clearing still-valid access tokens during bootstrap retries.
- Temporary refresh failures after access-token expiry move `auth-core` into retrying recovery rather than forcing immediate sign-out.
- Expired-session refresh failures with `401` or `403` clear frontend auth state.
- Cross-tab refresh followers wait beyond lock TTL before abandoning sibling refresh ownership.
- Admin and tenant private shells preserve mounted profile/navigation state during same-user silent token refresh.
- Profile/bootstrap revalidation can retry once after `401`/`403` through `auth-core` recovery before sign-out.

## Planned / Follow-Up

- Track future auth cleanup in `platform/frontend/docs/contracts/auth-runtime.md`, backend auth contracts, or a new explicit proposal; the old `auth-runtime-followups.md` pointer was deleted.
- Continue removing stale legacy assumptions around frontend refresh-token storage.

## Risks

- A frontend change can accidentally expect `refresh_token` in JSON again.
- Shell bootstrap can regress into loader loops on stalled refresh/profile calls.
- Profile and navigation payload responsibilities can drift.
- Tenant context can be incorrectly pushed from frontend convenience state.
