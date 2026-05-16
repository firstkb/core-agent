# Evidence

- Work ID: `2026-05-15-platform-stability-audit`
- Shape: aggregate Markdown evidence log.

## Summary

The first read-only stability baseline passed. Required repository checks, backend tests/builds, and frontend lint/typecheck/tests/build all completed successfully. The local Node PATH drift was corrected at machine level and guarded at project level; remaining baseline risks are large frontend production chunks and uneven explicit test coverage across backend packages and frontend shared packages.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| `scripts/preflight.sh --full` | passed | local command output | Required docs/memory/env/runtime checks passed; optional backend and frontend checks passed. |
| Backend `go test ./...` via preflight | passed | local command output | Packages passed; several runtime/wiring packages currently have no test files. |
| Backend `go build ./cmd/...` via preflight | passed | local command output | All backend command entrypoints built. |
| Frontend `pnpm lint` via preflight | passed | local command output | All 13 frontend packages/apps linted successfully. |
| Frontend `pnpm typecheck` via preflight | passed | local command output | All 13 frontend packages/apps typechecked successfully. |
| Frontend `pnpm test` via preflight | passed | local command output | 5 frontend packages/apps ran tests: `api-client`, `auth-core`, `forms`, `platform-admin-web`, `tenant-web`. |
| Frontend `pnpm build` via preflight | passed | local command output | Admin and tenant apps built; Vite emitted chunk-size warnings. |
| Backend test-file inventory | passed | `go list -f '{{.ImportPath}} {{len .TestGoFiles}} {{len .XTestGoFiles}}' ./...` | Used to identify packages with no direct test files. |
| Frontend script inventory | passed | local Node package script inventory | Several shared packages have lint/typecheck but no package-level test script. |
| Build Web Apps / Browser public auth smoke | passed | Browser screenshots and DOM/log checks | `platform-admin-web` and `tenant-web` public sign-in screens rendered on desktop default viewport and mobile `390x844`; no console errors/warnings; Email/Phone tab interaction changed visible state. |
| Tenant Browser auth smoke | passed | Browser Use against `https://demo.platform.localhost/sign-in` | Auth: local seeded dev login. OTP request screen, code verification, redirect to `/dashboard`, private shell render, reload persistence, and console health passed. |
| Tenant direct auth/API probe | passed | Local direct runtime calls to auth `8082` and tenant API `8080` | Auth: local seeded dev login. OTP request, OTP verify, refresh, profile, navigation, and isolated logout returned 200 with expected response shape. |
| Auth FE targeted tests | passed | `pnpm --filter @platform/api-client test`; `pnpm --filter @platform/auth-core test`; `pnpm --filter @platform/tenant-web test` | 18 api-client tests, 16 auth-core tests, and 95 tenant-web tests passed. |
| Auth FE lint/typecheck | passed | `pnpm --filter @platform/api-client lint`; `pnpm --filter @platform/auth-core lint`; `pnpm --filter @platform/tenant-web lint`; typecheck for all three | Same Node engine warning remained: current pnpm runtime reports Node `v18.17.0`, workspace requires `>=22.12.0`. |
| Auth BE targeted tests | passed | `go test ./internal/platform/auth ./modules/shared/authentication ./modules/shared/sessions ./modules/tenant/profile ./cmd/auth/internal/server ./cmd/api-tenant/internal/server` | Auth, sessions, tenant profile, and auth server tests passed. |
| Docs/memory artifact check | passed | `python3 scripts/checks/docs_memory_check.py --check` | Evidence/work artifact update passed repository docs/memory validation. |
| Tenant secure route wiring test | passed | `go test ./cmd/api-tenant/internal/server` | Added coverage that `/app/profile`, `/app/navigation`, `/app/platform-studio/navigation`, and `/app/platform-studio/forms/models` classify as `TierSecure`. |
| Auth BE targeted retest | passed | `go test ./internal/platform/auth ./modules/shared/authentication ./modules/shared/sessions ./modules/tenant/profile ./cmd/auth/internal/server ./cmd/api-tenant/internal/server` | Retested Auth/session/profile/auth server plus tenant server route wiring after adding coverage. |
| Tenant Auth dependency Browser smoke | passed | Browser Use against `https://demo.platform.localhost/` | Auth: local seeded dev login. Dashboard, Form Builder, and Navigation Builder rendered inside private shell without sign-in redirect or console errors/warnings. Screenshots saved under `/private/tmp/vsm-auth-dependency-2026-05-16/`. |
| Tenant unauthenticated secure API probes | passed | `curl` to direct tenant API `localhost:8080` without bearer token | `/app/profile`, `/app/navigation`, `/app/platform-studio/navigation`, and `/app/platform-studio/forms/models` returned `401 Unauthorized`. |
| Tenant FE tests with Node 22 path | passed | `env PATH="/opt/homebrew/bin:$PATH" pnpm --filter @platform/tenant-web test` | Historical confirmation before the machine-level PATH fix: 26 files / 95 tests passed without the Node engine warning. |
| Node login-shell PATH verification | passed | `/bin/zsh -lc 'which node'`; `/bin/bash -lc 'which node'`; `node -v` | Both zsh and bash login shells now resolve `/opt/homebrew/bin/node`; frontend cwd reports Node `v22.22.1`. |
| Project wrong-node guard | passed | `env PATH="/usr/local/bin:/Users/andrew/Library/pnpm:/usr/bin:/bin" pnpm --filter @platform/tenant-web exec node -v` | Fails fast with `ERR_PNPM_UNSUPPORTED_ENGINE`, expected `>=22.12.0`, got `v18.17.0`. |
| Tenant FE tests after PATH/guard fix | passed | `pnpm --filter @platform/tenant-web test` | 26 files / 95 tests passed without wrapper or one-off PATH override. |
| Full preflight after PATH/guard fix | passed | `scripts/preflight.sh --full` | Required docs/memory/env/runtime checks passed; backend tests/builds and frontend lint/typecheck/tests/build passed. Turbo cache missed after Node/version-manager hash inputs changed, avoiding stale Node 18 build logs. |
| Docs/memory check | passed | `python3 scripts/checks/docs_memory_check.py --check` | Passed after work/evidence and durable memory updates. |
| Env policy check | passed | `python3 scripts/checks/check_env_policy.py --check` | Passed after durable memory/work artifact updates. |
| Lite preflight | passed | `scripts/preflight.sh` | Docs memory, env policy, and runtime drift checks passed. |

## Auth Code-Test Findings

### Errors

- No test, lint, or typecheck failures were found in the targeted Auth slice.
- Tenant auth Browser smoke and direct auth/API probe passed end-to-end.
- Local environment drift was corrected after discovery: frontend commands now resolve Node `v22.22.1`, and wrong-node runs fail fast through `pnpm` engine enforcement.

### Logic

- FE OTP login normalizes email/phone and calls the tenant OTP endpoints through `auth-core`; no tenant identity is supplied from the browser.
- FE refresh/logout/request/verify auth client calls use `credentials: "include"` so the refresh cookie stays browser-managed.
- Current FE auth storage persists access token and expiry only; cleanup removes legacy refresh/id token keys.
- Tenant app profile bootstrap uses the tenant API profile client with bearer token and unauthorized retry/recovery behavior.
- BE OTP code generation uses fixed-code behavior for development-like environments (`dev`, `test`, and `stage`) and random OTP generation only outside those environments.
- BE tenant OTP request/verify resolves tenant from request context, enforces tenant policy/user status, hashes OTP codes, deletes successful OTPs, issues tenant-scoped access tokens, and stores refresh token records server-side.
- BE refresh rotates refresh tokens, detects reuse, validates tenant host/domain, and rechecks tenant user status before issuing a new access token.
- BE logout clears the refresh cookie at the HTTP layer and revokes refresh token family/user sessions according to request scope.
- Notification delivery is not production-ready: the current notify provider has debug email/SMS senders only, and non-debug providers are explicitly not implemented.

### Boundaries / Monolith Risk

- FE responsibilities are separated across `api-client` transport, `auth-core` auth state/service, and `tenant-web` shell/profile bootstrap.
- BE responsibilities are separated across `cmd/auth` HTTP/cookie routes, `modules/shared/authentication` auth/session logic, `modules/shared/sessions` refresh persistence, and `modules/tenant/profile` profile projection.
- No handler-owned SQL was observed in the Auth/profile route path reviewed.

### Contract / Security Drift

- Confirmed: refresh token is returned as an HttpOnly cookie by auth server and refresh/logout require an allowed `Origin`.
- Confirmed: tenant API secure routes run through tenant guard, claims middleware, and optional local token validation.
- Owner decision: `modules/shared/authentication/service.go` includes OTP `code` values in audit event data for OTP request success/failure and OTP verify failures, and `modules/shared/audit/service.go` writes event data to tenant DB. This is temporarily acceptable because real email/SMS delivery is not implemented yet. Do not treat redaction as part of the current testing scope unless the owner explicitly opens an Auth implementation slice.
- Finding: `internal/platform/notify/service.go` falls back to debug/no-send mode when external providers are disabled, in development-like environments, or when provider settings are empty. If non-debug providers are configured, it returns `notify: non-debug providers are not implemented yet`.

### Coverage Gaps

- `cmd/api-tenant/internal/server` now has direct secure route wiring coverage for profile, runtime navigation, and Platform Studio entrypoints.
- Tenant auth UI has Browser smoke coverage and shared auth-core/api-client tests, but no narrow tenant sign-in component/integration test observed.
- Audit-data redaction for Auth events is not covered by tests; this is accepted for now under the current debug-only delivery mode.
- There is no production email/SMS provider implementation or provider-contract test for OTP delivery; this belongs to a separate future implementation slice, not the current testing slice.
- Tenant sign-in UI has no narrow component/integration test in `tenant-web`; current coverage is shared auth-core/api-client tests plus Browser smoke.

## Changed Files

- `maestro/artifact/active/2026-05-15-platform-stability-audit/work.md`
- `maestro/artifact/active/2026-05-15-platform-stability-audit/evidence.md`
- `platform/backend/cmd/api-tenant/internal/server/routes_test.go`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/durable/decisions/product-platform.md`
- `maestro/memory/modules/domains/auth-and-session/state.md`
- `platform/frontend/.npmrc`
- `platform/frontend/turbo.json`
- `platform/frontend/AGENTS.md`
- `platform/frontend/docs/guides/local-dev.md`
- `maestro/memory/modules/frontend/workspace/README.md`
- local machine only: `~/.zprofile` and `~/.bash_profile` now put `/opt/homebrew/bin` before `/usr/local/bin` for login shells; backups were created as `~/.zprofile.codex-backup-20260516174257` and `~/.bash_profile.codex-backup-20260516174539`.

## Browser / Visual Evidence

- Browser plugin available and used through Build Web Apps `frontend-testing-debugging`.
- Flow under test: app loads -> public sign-in screen renders -> Email/Phone tab interaction changes visible input state without runtime errors.
- Admin URL: `http://localhost:5173/sign-in` from `http://localhost:5173/`; title `Platform Admin Web`.
- Tenant URL: `http://localhost:5174/`; title `Tenant Web`.
- Viewports: default desktop browser viewport and mobile `390x844`.
- Console health: no relevant `error` or `warn` logs observed for these public auth screens.
- Tenant authenticated auth smoke used the in-app browser at `https://demo.platform.localhost/sign-in`.
- Authenticated flow: sign-in -> OTP request -> code verify -> redirect to `https://demo.platform.localhost/dashboard` -> private dashboard shell visible.
- Private shell evidence: Dashboard, Platform Studio utility, workspace search, actions, notification button, tenant user menu, and dashboard content rendered.
- Console health after login/reload: no relevant `error` or `warn` logs observed.
- Tenant Auth dependency smoke:
  - Dashboard URL: `https://demo.platform.localhost/dashboard`; title `Tenant Web`; Dashboard, Platform Studio, and workspace search rendered; console warn/error count `0`.
  - Form Builder URL: `https://demo.platform.localhost/builder/forms`; title `Tenant Web`; Platform Studio/Form Builder content rendered; no sign-in surface; console warn/error count `0`.
  - Navigation Builder URL: `https://demo.platform.localhost/builder/navigation`; title `Tenant Web`; Navigation Builder, Save state, App menu, and Utility rail content rendered; no sign-in surface; console warn/error count `0`.
  - Screenshots: `/private/tmp/vsm-auth-dependency-2026-05-16/dashboard-auth-state.png`, `/private/tmp/vsm-auth-dependency-2026-05-16/platform-studio-forms-auth-state.png`, `/private/tmp/vsm-auth-dependency-2026-05-16/navigation-builder-auth-state.png`.

## Review Evidence

- Not run yet.

## Skipped Checks

- Direct shell probe against `https://demo.platform.localhost` from shell: skipped because no local port `443` proxy listener was available to shell. Browser Use still validated the HTTPS tenant route.
- Migration smoke / local DB bootstrap: skipped in baseline to avoid broad DB work before module prioritization.

## Residual Risks

- Other machines can still hit wrong-node PATH ordering if their shell/version-manager setup ignores `platform/frontend/.node-version`, `.nvmrc`, and `package.json` `engines`; project `.npmrc` now fails fast instead of continuing with warnings.
- Frontend production builds emit large chunk warnings: `platform-admin-web` chunks above 500 kB and `tenant-web` main JS around 1.64 MB before gzip.
- Backend packages without direct test files include several command roots, server wiring areas, profile/forms/notifications helpers, and tooling packages.
- Frontend shared packages without package-level test scripts include `app-shell`, `collection-table`, `design-tokens`, `i18n`, `install-helper`, `platform-studio-core`, `tenant-core`, and `ui-kit`.
- Admin authenticated auth remains out of current scope by owner decision.
- Browser-side read-only page scope could not call `fetch`, so profile/navigation/refresh endpoint evidence was collected through isolated local direct runtime calls instead.
- Auth audit event data currently includes OTP code values in persisted audit payloads; owner accepts this temporarily while OTP delivery is debug-only and real email/SMS delivery is not implemented.
- OTP delivery is debug-only today. Production email/SMS delivery needs a separate future implementation slice with a real provider path, explicit prod config guard, and tests proving prod cannot silently no-send OTP messages.
- Tenant sign-in component/integration test remains a coverage improvement candidate. It should be added in a separate FE testing slice only if we decide to introduce or standardize DOM/component testing for app-level auth flows.
