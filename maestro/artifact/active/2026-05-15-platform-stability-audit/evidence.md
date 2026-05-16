# Evidence

- Work ID: `2026-05-15-platform-stability-audit`
- Shape: aggregate Markdown evidence log.

## Summary

The first read-only stability baseline passed. Required repository checks, backend tests/builds, and frontend lint/typecheck/tests/build all completed successfully. The local Node PATH drift was corrected at machine level and guarded at project level. Auth, Navigation Builder, and Form Runtime/table/App Pages tenant slices passed targeted FE/BE/browser testing. Form Runtime decomposition slices reduced immediate frontend monolith pressure, and the empty-create Job Type backend `500` found during Browser smoke is now covered by a backend validation fix. Remaining risks are large frontend production chunks, uneven explicit shared-package coverage, and true browser/DB mutation coverage that still needs a disposable tenant or explicit owner approval.

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
| Navigation Builder BE targeted tests | passed | `go test ./modules/tenant/platformstudionavigationbuilder ./cmd/api-tenant/internal/server` | Module service/repository/derived runtime behavior plus tenant server route wiring passed. |
| Navigation Builder adjacent BE runtime tests | passed | `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/apppages/businesstree ./modules/tenant/platformstudioformbuilder` | Covers the primary runtime targets Navigation Builder projects into tenant routes. |
| Navigation Builder FE API client tests | passed | `pnpm --filter @platform/api-client test` | 18 tests passed, including tenant navigation contract/client coverage. |
| Navigation Builder FE core lint/typecheck | passed | `pnpm --filter @platform/platform-studio-core lint`; `pnpm --filter @platform/platform-studio-core typecheck` | Package has no package-level test script; lint and typecheck passed. |
| Navigation Builder tenant-web targeted tests | passed | `pnpm --filter @platform/tenant-web test -- tests/platform-studio/navigation/navigation-builder-state.test.ts tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/published-app/published-navigation-sidebar-adapter.test.ts` | 4 files / 22 tests passed for builder state, runtime projection, tenant sidebar navigation, and published-app adapter behavior. |
| Navigation Builder tenant-web typecheck/lint | passed | `pnpm --filter @platform/tenant-web typecheck`; `pnpm --filter @platform/tenant-web lint` | Tenant app typecheck and lint passed after targeted tests. |
| Navigation Builder API client typecheck/lint | passed | `pnpm --filter @platform/api-client typecheck`; `pnpm --filter @platform/api-client lint` | Shared API client typecheck and lint passed. |
| Navigation Builder Browser smoke | passed | Browser Use at `https://demo.platform.localhost/builder/navigation` | Authenticated page rendered, app menu and utility rail tabs worked, add-item choices matched contract, Save stayed disabled/Saved after non-persistent interactions, and console warn/error count was `0`. |
| Navigation Builder evidence preflight | passed | `scripts/preflight.sh` | Docs memory, env policy, and runtime drift checks passed after Navigation Builder artifact updates. |
| Navigation Builder memory update | passed | `maestro/memory/modules/domains/platform-studio/tools/navigation-builder.md`; `maestro/memory/durable/current-state.md` | Persisted owner-confirmed maintainability risk for large Navigation Builder frontend files before further feature expansion. |
| Form Runtime / App Pages BE targeted tests | passed | `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./modules/tenant/apppages/businesstree ./cmd/api-tenant/internal/server` | Runtime form read/write service tests, Form Builder runtime list/query support, Business Tree App Page, and tenant server route wiring passed. |
| Form Runtime FE shared form tests | passed | `pnpm --filter @platform/forms test` | 1 file / 23 tests passed for shared runtime form primitives. |
| Form Runtime FE API client tests | passed | `pnpm --filter @platform/api-client test` | 1 file / 18 tests passed. |
| Collection Table targeted test | passed | `pnpm --filter @platform/collection-table exec vitest run src/collection-table-runtime.test.ts` | 1 file / 7 tests passed. Package currently has no package-level `test` script. |
| Tenant runtime navigation tests | passed | `pnpm --filter @platform/tenant-web test -- tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/platform-studio/platform-studio-route-meta.test.ts` | 3 files / 10 tests passed for runtime navigation/sidebar/route metadata. |
| Form Runtime FE typecheck/lint | passed | `pnpm --filter @platform/tenant-web typecheck`; `pnpm --filter @platform/tenant-web lint`; `pnpm --filter @platform/collection-table typecheck`; `pnpm --filter @platform/collection-table lint`; `pnpm --filter @platform/forms typecheck`; `pnpm --filter @platform/forms lint`; `pnpm --filter @platform/api-client typecheck`; `pnpm --filter @platform/api-client lint` | Tenant app and shared packages typechecked/linted successfully. |
| Form Runtime Browser smoke | passed | Browser Use at `https://demo.platform.localhost/` | Authenticated Job Type runtime table, record view dialog, create form render, Business Tree App Page, and Business Tree branch expansion rendered without access denial or console warnings/errors. |
| Form Runtime unauthenticated API probes | passed | `curl` to direct tenant API `localhost:8080` without bearer token | `/app/forms/jobtype/views/view-default/meta`, `/query`, `/form`, and `/app/pages/business-tree/nodes` returned `401 Unauthorized`. |
| Form Runtime memory update | passed | `maestro/memory/durable/current-state.md`; `maestro/memory/modules/frontend/tenant-web/README.md` | Persisted runtime form/table large-file maintainability risk as a future decomposition trigger. |
| Form Runtime evidence preflight | passed | `scripts/preflight.sh` | Docs memory, env policy, and runtime drift checks passed after Form Runtime/App Pages artifact and memory updates. |
| Form Runtime decomposition tenant-web typecheck | passed | `pnpm --filter @platform/tenant-web typecheck` | Passed after extracting dialogs, load error, label hook, browser helpers, and lookup helpers from the runtime form page. |
| Form Runtime decomposition tenant-web lint | passed | `pnpm --filter @platform/tenant-web lint` | Passed after extraction. |
| Form Runtime decomposition tenant-web targeted tests | passed | `pnpm --filter @platform/tenant-web test -- tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/platform-studio/platform-studio-route-meta.test.ts` | 3 files / 10 tests passed after extraction. |
| Form Runtime decomposition shared FE tests | passed | `pnpm --filter @platform/forms test`; `pnpm --filter @platform/collection-table exec vitest run src/collection-table-runtime.test.ts`; `pnpm --filter @platform/api-client test` | `forms`: 23 tests passed; `collection-table`: 7 tests passed; `api-client`: 18 tests passed. |
| Form Runtime decomposition BE targeted tests | passed | `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./modules/tenant/apppages/businesstree ./cmd/api-tenant/internal/server` | Passed after FE decomposition to keep vertical runtime evidence aligned. |
| Form Runtime decomposition Browser smoke | passed | Browser Use at `https://demo.platform.localhost/` | Job Type runtime table, record view dialog, create form render, and Business Tree branch expansion passed after extraction; console warn/error count was `0`. |
| Form Runtime decomposition preflight | passed | `scripts/preflight.sh` | Docs memory, env policy, and runtime drift checks passed after decomposition evidence and memory updates. |
| Form Runtime empty-create BE targeted tests | passed | `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./cmd/api-tenant/internal/server` | Added regression coverage for mapping Postgres `23502` not-null failures on known runtime fields to `validationErrors` instead of route-level `500`. |
| Form Runtime jobtype DB/metadata probe | passed | local `psql` against `108-demo` | `public.jobtype.name` is `NOT NULL`; `ps_model` metadata for `jobtype.name` has no `required` flag. This reproduces the mismatch behind the empty-create Finish failure. |
| Diff whitespace check | passed | `git diff --check` | Passed after the backend validation fix. |
| Form Runtime stability commit preflight | passed | `scripts/preflight.sh --full` | Backend tests/builds plus frontend lint/typecheck/tests/build passed before committing the Form Runtime stability slice. Frontend build retained known large chunk warnings. |

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

## Navigation Builder Code-Test Findings

### Errors

- No targeted backend or frontend failures were found in the Navigation Builder slice.
- Authenticated Browser smoke at `/builder/navigation` rendered the builder without sign-in redirect, runtime error, or console warning/error.
- Browser smoke confirmed app menu and utility rail surfaces were reachable and the Save state remained `Saved`/disabled after non-persistent inspection interactions.

### Logic

- Backend tests cover authoring service behavior, optimistic versioning, validation, duplicate target prevention, runtime projection, and access derivation inside `modules/tenant/platformstudionavigationbuilder`.
- Adjacent backend tests for Form Runtime, Business Tree app pages, and Form Builder passed because Navigation Builder projects form views and app pages into runtime routes.
- Frontend targeted tests cover Navigation Builder state transformations, tenant runtime navigation projection, tenant sidebar navigation, and published-app navigation adapter behavior.
- Browser smoke confirmed the active app menu tree, utility rail items, selected inspector state, and add-item choices: `Menu title`, `Menu group`, `Form view`, `App page`, `Link`, and disabled/future `App module (later)`.
- Browser smoke did not press Save to avoid mutating shared demo tenant data; save/update behavior remains covered by backend service tests rather than demo-tenant mutation evidence.

### Boundaries / Monolith Risk

- Backend responsibilities are separated across handler/service/repository/runtime-access/derived logic in the dedicated `platformstudionavigationbuilder` package; no evidence was found that Navigation Builder persistence leaked into Form Builder.
- Direct target authorization is implemented through derived runtime/access guard wiring in the tenant server route path, not only through frontend hiding.
- Frontend responsibilities are split between `api-client`, `tenant-web` Platform Studio UI, shared tenant runtime navigation adapters, and `platform-studio-core` package boundaries.
- Monolith risk remains on the frontend: `navigation-builder-inspector.tsx` is over 1000 lines, while `navigation-builder-state.ts`, `navigation-builder-page.tsx`, and `navigation-builder-tree-panel.tsx` are each large enough that future additions should be decomposed before more behavior is added.
- `@platform/platform-studio-core` still has no package-level tests; current active Navigation Builder contract coverage lives mostly in `api-client` and `tenant-web`.

### Contract / Security Drift

- Observed backend/docs contract alignment: active V1 endpoints are `GET/PUT /app/platform-studio/navigation`, runtime `GET /app/navigation`, and access lookup/guard paths, with runtime filtering and access projection handled server-side.
- Observed UI contract alignment: app menu and utility rail authoring are separate tabs; selected items expose `Element` and `Access`; dashboard is locked in the app menu seed; add choices match the documented V1 set.
- No new auth/session or tenant-isolation drift was found in this slice.

### Coverage Gaps

- Browser evidence is authenticated and interactive, but intentionally non-mutating. A future isolated seed/demo tenant could add full create/update/save/reload Browser coverage without risking shared demo data.
- There is no package-level test script for `@platform/platform-studio-core`; this is not blocking today, but it weakens package-local ownership of Navigation Builder-adjacent contracts.
- Frontend large-file risk is structural, not a current functional failure. Decomposition should be handled as a separate refactor slice if Navigation Builder receives more features.

## Form Runtime / Tables / Static App Pages Findings

### Errors

- No targeted backend or frontend failures were found in the Form Runtime/table/App Pages slice.
- Authenticated Browser smoke rendered the Job Type runtime table, row record view dialog, create-form page, Business Tree App Page, and Business Tree branch expansion without sign-in redirect, access-restricted state, framework overlay, or console warning/error.
- Direct unauthenticated runtime/API probes returned `401`, so the tested runtime endpoints are not open without tenant auth.

### Logic

- Backend tests passed for `platformstudioformruntime`, `platformstudioformbuilder` runtime list/query support, `apppages/businesstree`, and tenant server wiring.
- Frontend shared runtime form tests passed in `@platform/forms`; Collection Table runtime test passed through direct Vitest invocation; tenant runtime navigation/sidebar/route metadata tests passed.
- Browser smoke confirmed runtime table output for `/app/forms/jobtype/views/view-default`, including visible columns, rows, pagination count, search/filter toolbar, row actions, and top-bar/shell context.
- Browser smoke confirmed record view opens a read-only dialog with record fields and print affordance.
- Browser smoke confirmed create form render at `/app/forms/jobtype/views/view-default/new` loads the authored form fields and finish action without submitting data.
- Browser smoke confirmed Business Tree is exposed as an App Page target at `/app/pages/business-tree` and branch expansion loads child nodes.

### Boundaries / Monolith Risk

- Runtime table behavior stays in shared `@platform/collection-table`, while tenant runtime host mapping stays in `tenant-web/features/form-runtime`.
- Business Tree stays an App Page under `features/app-pages/business-tree` and backend `modules/tenant/apppages/businesstree`; it should not be called or treated as a product module.
- Runtime Form View and App Page access stays attached to tenant secure routes and Navigation Builder-derived target guards.
- Strong frontend monolith risk: `forms-runtime-form-page.tsx` is over 2000 lines, `collection-table-page.tsx` is close to 900 lines, and `form-runtime-collection-table-client.ts` is over 700 lines. Future runtime form additions should start with a focused decomposition slice.
- Backend form runtime also has large files: `repository_write.go`, `service.go`, and `service_test.go` are large enough that new non-trivial runtime mutation logic should first identify a responsibility split.

### Contract / Security Drift

- Observed runtime contract alignment: real runtime routes are `/app/forms/:modelId/views/:viewId`, `/new`, `/view/:docGuid`, and Business Tree `/app/pages/business-tree`.
- Observed API contract alignment: runtime form meta/query/form and Business Tree node endpoints are tenant-secure and return `401` without auth.
- No new auth/session, tenant-isolation, or Navigation Builder target-guard drift was found in this slice.

### Coverage Gaps

- Browser smoke was intentionally non-mutating. It did not submit create/edit forms, run finish, toggle favorite, save filters, or execute bulk actions.
- Create/edit/bulk destructive behavior should be tested only against a disposable tenant or an explicit mutation-testing slice.
- There are no narrow `tenant-web` component/integration tests observed for `forms-runtime-form-page.tsx` or `forms-runtime-list-page.tsx`; current FE coverage is shared package tests, route/navigation tests, typecheck/lint, and Browser smoke.
- `@platform/collection-table` has a runtime test file but no package-level `test` script, so direct Vitest invocation is needed unless a package script is added later.

## Form Runtime Decomposition-Lite Findings

### Changes

- Extracted runtime form dialogs into `platform/frontend/apps/tenant-web/src/features/form-runtime/components/form-runtime-dialogs.tsx`.
- Extracted runtime form load-error surface into `platform/frontend/apps/tenant-web/src/features/form-runtime/components/form-runtime-load-error.tsx`.
- Extracted runtime form translation label assembly into `platform/frontend/apps/tenant-web/src/features/form-runtime/use-runtime-form-labels.ts`.
- Extracted browser/geolocation/token/control helpers into `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-browser-helpers.ts`.
- Extracted lookup dictionary/request/label helpers into `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-lookup-helpers.ts`.
- Reduced `forms-runtime-form-page.tsx` from roughly 2196 lines to 1799 lines.

### Errors

- No typecheck, lint, targeted frontend test, targeted backend test, or Browser smoke failure was found after the decomposition.
- Browser smoke after extraction showed no console warning/error logs for the tested runtime paths.

### Logic

- Runtime behavior was intentionally preserved: route paths, APIs, autosave/create/finish logic, row action behavior, dialog actions, load-error navigation, lookup option loading, and geolocation fallback semantics were not changed.
- The extraction only separated presentational UI, translation assembly, and pure helper logic from the route page.

### Boundaries / Monolith Risk

- The immediate UI/helper pressure in `forms-runtime-form-page.tsx` is reduced, but the page remains large and still owns autosave/create/edit/finish/subform/checklist orchestration.
- Next decomposition should target a runtime mutation controller/hook before adding substantial mutation behavior or disposable-tenant mutation coverage.
- `collection-table-page.tsx`, `form-runtime-collection-table-client.ts`, and backend `platformstudioformruntime` large files remain residual maintainability risks.

## Form Runtime Pure-Helper Decomposition Findings

### Changes

- Extracted value coercion, loose-value coercion, serialization, server-merge, dirty-create detection, and DOM string conversion helpers into `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-value-helpers.ts`.
- Extracted validation error filtering, first-error selection, validation message templating, server validation mapping, and first server validation message helpers into `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-validation-helpers.ts`.
- Extracted record/form-response subform mapping and subform data merge helpers into `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-subform-helpers.ts`.
- Extracted runtime conflict/schema-drift/not-found/load-error classification helpers into `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-error-helpers.ts`.
- Extracted runtime navigation session state types and guard into `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-navigation-state.ts`.
- Reduced `forms-runtime-form-page.tsx` from 1799 lines to 1492 lines in this second decomposition pass.

### Errors

- Direct tenant-web TypeScript check passed: `platform/frontend/node_modules/.bin/tsc --noEmit -p platform/frontend/apps/tenant-web/tsconfig.json`.
- Targeted tenant-web ESLint passed from `platform/frontend`: `node_modules/.bin/eslint apps/tenant-web/src/features/form-runtime`.
- Targeted tenant-web route/navigation tests passed from `apps/tenant-web`: `../../node_modules/.bin/vitest run tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/platform-studio/platform-studio-route-meta.test.ts`.
- Shared package tests passed from package roots:
  - `../../node_modules/.bin/vitest run src/runtime-form.test.ts` in `packages/forms`.
  - `../../node_modules/.bin/vitest run src/collection-table-runtime.test.ts` in `packages/collection-table`.
  - `../../node_modules/.bin/vitest run src/index.test.ts` in `packages/api-client`.
- Backend targeted tests passed: `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./modules/tenant/apppages/businesstree ./cmd/api-tenant/internal/server`.
- `pnpm --filter @platform/tenant-web typecheck/lint` and root Vitest invocation were blocked by local ignored `platform/frontend/.local/config/caddy` permissions (`EACCES`, root-owned local runtime directory). Equivalent direct workspace/package commands above were used instead.

### Logic

- Runtime behavior was intentionally preserved: route paths, API clients, autosave timers, create/update/finish order, subform/checklist mutations, lookup label merge semantics, and visible UI markup were not rewritten.
- Function bodies were moved into focused helper modules and imported back into the page; mutation/controller code remained in place.
- Browser smoke confirmed:
  - `/app/forms/jobtype/views/view-default` rendered `Job Type` and `Manager`, title `Tenant Web`, no framework overlay, console warn/error count `0`.
  - `/app/forms/jobtype/views/view-default/new` rendered `Online Form`, `Name`, and `Finish`, title `Tenant Web`, no framework overlay, console warn/error count `0`.
  - DOM interaction on the create form clicked `Finish` and opened an alertdialog without navigation away from the create route; console warn/error count `0`.
  - `/app/pages/business-tree` rendered `Business Tree` and `Corporate @ Atlas Safety Holdings`, title `Tenant Web`, no framework overlay, console warn/error count `0`.

### Boundaries / Monolith Risk

- The route page now delegates pure value, validation, subform mapping, error classification, browser, lookup, labels, and dialog/load-error concerns.
- The route page still owns mutation orchestration and remains the next high-risk FE concentration point: autosave, create, update, finish, subform navigation/delete, checklist update, and reveal/focus coordination are still local to `forms-runtime-form-page.tsx`.
- Browser screenshot capture failed during this pass with repeated `Page.captureScreenshot` timeout from the Browser plugin. DOM snapshots, console logs, URL/title checks, and DOM interaction evidence were collected; screenshot evidence from the immediately preceding decomposition pass remains available.

## Form Runtime Mutation-Controller Extraction Findings

### Changes

- Extracted `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-mutation-controller.ts`.
- Moved mutation-controller responsibilities out of `forms-runtime-form-page.tsx`: runtime request error handling, mutation response application, initial workflow status application, server validation handling, pending patch flush, autosave patch scheduling, and create-record readiness.
- Kept route-page responsibilities in place: finish button orchestration, back/unsaved flow, subform add/edit/delete shell, checklist item shell, reveal/focus coordination, DOM input sync, and `RuntimeFormScaffold` wiring.
- Reduced `forms-runtime-form-page.tsx` from 1492 lines to 1186 lines.

### Errors

- Direct tenant-web TypeScript check passed: `platform/frontend/node_modules/.bin/tsc --noEmit -p platform/frontend/apps/tenant-web/tsconfig.json`.
- Targeted tenant-web ESLint passed from `platform/frontend`: `node_modules/.bin/eslint apps/tenant-web/src/features/form-runtime`.
- Targeted tenant-web route/navigation tests passed from `apps/tenant-web`: `../../node_modules/.bin/vitest run tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/platform-studio/platform-studio-route-meta.test.ts`.
- Shared package tests passed from package roots:
  - `../../node_modules/.bin/vitest run src/runtime-form.test.ts` in `packages/forms`.
  - `../../node_modules/.bin/vitest run src/collection-table-runtime.test.ts` in `packages/collection-table`.
  - `../../node_modules/.bin/vitest run src/index.test.ts` in `packages/api-client`.
- Backend targeted tests passed: `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./modules/tenant/apppages/businesstree ./cmd/api-tenant/internal/server`.
- `git diff --check` passed for the controller extraction files.

### Logic

- Runtime behavior was intentionally preserved: existing refs and state setters are passed into the controller, and the moved function bodies preserve the same pending patch, lookup label, validation, access-token, route replacement, and save-state sequences.
- Browser smoke confirmed:
  - `/app/forms/jobtype/views/view-default` rendered `Job Type` and `Manager`, title `Tenant Web`, no framework overlay, console warn/error count `0`.
  - `/app/forms/jobtype/views/view-default/new` rendered `Online Form`, `Name`, and `Finish`, title `Tenant Web`, no framework overlay, console warn/error count `0`.
  - DOM interaction clicked `Finish` and opened an alertdialog on the create route; console warn/error count `0`.
  - `/app/pages/business-tree` rendered `Business Tree` and `Corporate @ Atlas Safety Holdings`, title `Tenant Web`, no framework overlay, console warn/error count `0`.

### Boundaries / Monolith Risk

- `forms-runtime-form-page.tsx` now delegates pure helpers, dialogs/labels, lookup/browser helpers, and core mutation-controller work.
- The new mutation controller is cohesive but currently 506 lines; future mutation features should add regression tests before extending it further.
- Residual route-page concentration remains around finish/subform/checklist/UI orchestration.
- Browser screenshot capture still failed with `Page.captureScreenshot` timeout in the current Browser plugin session; DOM/console/interaction evidence was collected.

## Form Runtime Mutation Contract Coverage Findings

### Changes

- Added
  `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-collection-table-client.test.ts`.
- Covered FE client contracts for Form Runtime mutations without changing
  product code:
  - create record: `POST /app/forms/:model/views/:view/records`
  - update record: `PATCH /app/forms/:model/views/:view/records/:docGuid`
  - finish record: `POST /app/forms/:model/views/:view/records/:docGuid/finish`
  - favorite toggle: `POST /app/forms/:model/views/:view/favorite/toggle`
  - saved filter create/delete:
    `POST /app/forms/:model/views/:view/saved-filters` and
    `DELETE /app/forms/:model/views/:view/saved-filters/:id`
  - bulk action: `POST /app/forms/:model/views/:view/bulk-actions/:actionId`
- Covered bearer auth headers, JSON bodies, encoded runtime path segments,
  response normalization, and backend error-envelope propagation.

### Errors

- New tenant-web mutation contract test passed:
  `../../node_modules/.bin/vitest run src/features/form-runtime/form-runtime-collection-table-client.test.ts`
  from `platform/frontend/apps/tenant-web` (`3` tests).
- Direct tenant-web TypeScript check passed:
  `platform/frontend/node_modules/.bin/tsc --noEmit -p platform/frontend/apps/tenant-web/tsconfig.json`.
- Targeted tenant-web ESLint passed from `platform/frontend`:
  `node_modules/.bin/eslint apps/tenant-web/src/features/form-runtime`.
- Targeted tenant-web tests passed from `apps/tenant-web`:
  `../../node_modules/.bin/vitest run tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/platform-studio/platform-studio-route-meta.test.ts src/features/form-runtime/form-runtime-collection-table-client.test.ts`
  (`13` tests).
- Backend targeted tests passed from `platform/backend`:
  `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder`.

### Logic

- Product runtime code was not changed in this slice.
- The new FE tests assert the exact method, URL, bearer auth header, JSON
  content type, and request body for each mutation family.
- The existing BE test packages continue to cover runtime create/update/finish,
  favorites, saved filters, and bulk actions at the service/route level.

### Boundaries / Monolith Risk

- This is contract-level mutation coverage, not a browser-driven write-through
  test against a real disposable tenant database.
- Shared demo tenant data was not mutated.
- The test gives a safer guard before future mutation-controller changes, but
  finish/subform/checklist/UI orchestration still needs separate targeted
  regression coverage before heavier behavior changes.

## Form Runtime Checklist/Subform Coverage Findings

### Changes

- Extended
  `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-collection-table-client.test.ts`.
- Added FE client contract coverage for:
  - subform load:
    `GET /app/forms/:model/views/:view/records/:parentDocGuid/subforms/:subformId/records/:docGuid/form`
  - subform create:
    `POST /app/forms/:model/views/:view/records/:parentDocGuid/subforms/:subformId/records`
  - subform update/delete:
    `PATCH` and `DELETE /app/forms/:model/views/:view/records/:parentDocGuid/subforms/:subformId/records/:docGuid`
  - checklist item update:
    `PATCH /app/forms/:model/views/:view/records/:parentDocGuid/subforms/:subformId/checklist/items/:sourceRef`
- Covered encoded parent/child/subform/source path segments, bearer auth
  headers, JSON bodies, and normalized responses.

### Errors

- New/extended tenant-web mutation contract test passed:
  `../../node_modules/.bin/vitest run src/features/form-runtime/form-runtime-collection-table-client.test.ts`
  from `platform/frontend/apps/tenant-web` (`5` tests).
- Direct tenant-web TypeScript check passed:
  `platform/frontend/node_modules/.bin/tsc --noEmit -p platform/frontend/apps/tenant-web/tsconfig.json`.
- Targeted tenant-web ESLint passed from `platform/frontend`:
  `node_modules/.bin/eslint apps/tenant-web/src/features/form-runtime`.
- Targeted tenant-web tests passed from `apps/tenant-web`:
  `../../node_modules/.bin/vitest run tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/platform-studio/platform-studio-route-meta.test.ts src/features/form-runtime/form-runtime-collection-table-client.test.ts`
  (`15` tests).
- Backend targeted tests passed from `platform/backend`:
  `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./cmd/api-tenant/internal/server`.

### Logic

- Product runtime code was not changed in this slice.
- FE client tests now protect subform/checklist endpoint shapes that the route
  page depends on for nested record work.
- Existing BE tests cover subform load/create/update/delete, subform required
  and unique validation, checklist matrix render/upsert, Form Builder runtime
  subform planning, and tenant server route wiring.

### Boundaries / Monolith Risk

- This remains contract-level automated coverage, not a rendered browser/DB
  write-through test.
- Shared demo tenant data was not mutated.
- Residual frontend concentration remains in the route page around finish,
  subform shell actions, checklist shell actions, reveal/focus, and dialog
  orchestration.

## Form Runtime Checklist/Subform Controller Extraction Findings

### Changes

- Added
  `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-subform-controller.ts`.
- Added
  `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-subform-helpers.test.ts`.
- Extended
  `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-subform-helpers.ts`
  with `mergeRuntimeChecklistItemState`.
- Moved parent-record readiness, subform add/edit/delete, subform reload, and
  checklist item update orchestration out of `forms-runtime-form-page.tsx`.
- Reduced `forms-runtime-form-page.tsx` from 1186 lines to 988 lines.

### Errors

- Targeted tenant-web form-runtime tests passed:
  `../../node_modules/.bin/vitest run src/features/form-runtime/form-runtime-subform-helpers.test.ts src/features/form-runtime/form-runtime-collection-table-client.test.ts`
  from `platform/frontend/apps/tenant-web` (`7` tests).
- Direct tenant-web TypeScript check passed:
  `platform/frontend/node_modules/.bin/tsc --noEmit -p platform/frontend/apps/tenant-web/tsconfig.json`.
- Targeted tenant-web ESLint passed from `platform/frontend`:
  `node_modules/.bin/eslint apps/tenant-web/src/features/form-runtime`.
- Targeted tenant-web route/client/helper tests passed from `apps/tenant-web`:
  `../../node_modules/.bin/vitest run tests/shared/tenant-runtime-navigation.test.ts tests/shared/tenant-sidebar-navigation.test.ts tests/platform-studio/platform-studio-route-meta.test.ts src/features/form-runtime/form-runtime-collection-table-client.test.ts src/features/form-runtime/form-runtime-subform-helpers.test.ts`
  (`17` tests).
- Shared forms package test passed:
  `../../node_modules/.bin/vitest run src/runtime-form.test.ts` from
  `platform/frontend/packages/forms` (`23` tests).
- Backend targeted tests passed from `platform/backend`:
  `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./cmd/api-tenant/internal/server`.
- `git diff --check` passed.

### Logic

- The extraction preserves the existing call order for parent create/flush,
  subform add/edit routing, subform delete, checklist optimistic merge,
  checklist server reconciliation, save-state updates, and error dialogs.
- The pure helper test covers checklist item merge behavior for matching source
  rows and the no-checklist fallback state.

### Browser / Visual

- Browser plugin smoke passed after extraction:
  - Runtime table URL:
    `https://demo.platform.localhost/app/forms/jobtype/views/view-default`;
    title `Tenant Web`; `Job Type` heading count `1`; search content present;
    no framework overlay; console warn/error count `0`.
  - Create form URL:
    `https://demo.platform.localhost/app/forms/jobtype/views/view-default/new`;
    title `Tenant Web`; `Online Form` count `1`; `Finish` button count `1`;
    no framework overlay; console warn/error count `0`.
  - Interaction: clicked `Finish` on the empty create form; alertdialog count
    `1`; no framework overlay; console warn/error count `0`.
  - Follow-up: the same interaction surfaced a backend `500` in the running
    API because `jobtype.name` is physically `NOT NULL` while runtime metadata
    did not mark it `required`; this is fixed in the BE validation slice below.
  - Screenshot:
    `/private/tmp/vsm-form-runtime-subform-controller-2026-05-16/create-finish-dialog-after-subform-controller.png`.

### Boundaries / Monolith Risk

- `forms-runtime-form-page.tsx` now delegates core mutation behavior and nested
  subform/checklist orchestration to controllers.
- Residual route-page concentration remains around finish/back/dialog/reveal
  orchestration and DOM control sync.
- `form-runtime-mutation-controller.ts` is still 506 lines; new mutation
  behavior should extend tests before extending that controller.

## Form Runtime Empty-Create BE Validation Findings

### Changes

- Added `platform/backend/modules/tenant/platformstudioformruntime/repository_errors.go`
  and updated `repository_write.go` to wrap Postgres `23502` not-null failures
  as typed runtime mutation constraint errors without growing the write module
  further.
- Updated `platform/backend/modules/tenant/platformstudioformruntime/runtime_validation.go`
  and `service.go` to map known constraint columns back to runtime fields and
  return the existing mutation `validationErrors` response shape.
- Added regression coverage in
  `platform/backend/modules/tenant/platformstudioformruntime/service_test.go`
  and `repository_write_test.go`.
- Updated the backend Form Builder contract to state that known DB not-null
  failures are validation responses, not internal server errors.

### Errors

- Targeted Form Runtime package test passed:
  `go test ./modules/tenant/platformstudioformruntime`.
- Adjacent backend runtime tests passed:
  `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./cmd/api-tenant/internal/server`.
- `git diff --check` passed.

### Logic

- Root cause confirmed in local demo DB:
  - `public.jobtype.name` has `attnotnull = true`.
  - `ps_model` metadata for `jobtype.name` has no `required` value.
- Before this fix, an empty create request with only a client create token could
  reach `INSERT`, fail on the physical `name` constraint, and be logged as
  `FORM_RUNTIME_RECORD_CREATE` with `500`.
- After this fix, known not-null failures for mapped runtime fields return
  `validationErrors`, e.g. `fieldId: "name"` with the existing required-field
  message format.
- Unmapped database constraint failures still propagate as errors; the fix does
  not hide schema drift behind a generic field validation response.

### Boundaries / Monolith Risk

- No migration, seed, tenant data, route, payload, FE behavior, or auth/tenant
  behavior was changed.
- The fix is intentionally defensive at the BE runtime boundary; cleanup of
  static/external metadata such as marking `jobtype.name` required can be a
  separate schema/seed contract slice if approved.
- Browser verification against the running app still requires restarting the
  local backend so it picks up the compiled Go change.

## Changed Files

- `maestro/artifact/active/2026-05-15-platform-stability-audit/work.md`
- `maestro/artifact/active/2026-05-15-platform-stability-audit/evidence.md`
- `platform/backend/cmd/api-tenant/internal/server/routes_test.go`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/modules/tenant/platformstudioformruntime/repository_errors.go`
- `platform/backend/modules/tenant/platformstudioformruntime/repository_write.go`
- `platform/backend/modules/tenant/platformstudioformruntime/repository_write_test.go`
- `platform/backend/modules/tenant/platformstudioformruntime/runtime_validation.go`
- `platform/backend/modules/tenant/platformstudioformruntime/service.go`
- `platform/backend/modules/tenant/platformstudioformruntime/service_test.go`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/durable/decisions/product-platform.md`
- `maestro/memory/modules/domains/auth-and-session/state.md`
- `platform/frontend/.npmrc`
- `platform/frontend/turbo.json`
- `platform/frontend/AGENTS.md`
- `platform/frontend/docs/guides/local-dev.md`
- `maestro/memory/modules/frontend/workspace/README.md`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/modules/domains/platform-studio/tools/navigation-builder.md`
- `maestro/memory/modules/frontend/tenant-web/README.md`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/components/form-runtime-dialogs.tsx`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/components/form-runtime-load-error.tsx`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-browser-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-error-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-lookup-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-mutation-controller.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-collection-table-client.test.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-navigation-state.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/pages/forms-runtime-form-page.tsx`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-subform-controller.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-subform-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-subform-helpers.test.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-validation-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-value-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/form-runtime/use-runtime-form-labels.ts`
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
- Tenant Navigation Builder smoke:
  - URL: `https://demo.platform.localhost/builder/navigation`; title `Tenant Web`; authenticated Platform Studio Navigation Builder rendered.
  - App menu surface: app menu tab rendered seeded navigation tree and selected inspector with `Element`/`Access`; screenshot `/private/tmp/vsm-navigation-builder-2026-05-16/navigation-builder-app-menu.png`.
  - Utility rail surface: utility rail tab rendered `Platform Studio`, `Task Manager`, `Favorites`, and `Help Center`; selected inspector exposed utility visibility state; screenshot `/private/tmp/vsm-navigation-builder-2026-05-16/navigation-builder-utility-rail.png`.
  - Add flow: root add popover exposed `Menu title`, `Menu group`, `Form view`, `App page`, `Link`, and disabled `App module (later)` choices; no save was triggered; screenshot `/private/tmp/vsm-navigation-builder-2026-05-16/navigation-builder-app-menu-after-add-cancel.png`.
  - Console health: no relevant `error` or `warn` logs observed during Navigation Builder interactions.
- Tenant Form Runtime / App Pages smoke:
  - Dashboard entry screenshot: `/private/tmp/vsm-form-runtime-2026-05-16/dashboard-runtime-entry.png`.
  - Runtime table URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default`; title `Tenant Web`; `Job Type` table rendered with rows, actions, search/filter toolbar, pagination, and no access-restricted state; screenshot `/private/tmp/vsm-form-runtime-2026-05-16/form-runtime-job-type-table.png`.
  - Record view dialog opened from the first `View` row action and rendered record values plus print affordance; screenshot `/private/tmp/vsm-form-runtime-2026-05-16/form-runtime-job-type-record-view.png`.
  - Create form URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default/new`; rendered `Online Form`, `Name`, `Active`, and `Finish` without submitting; screenshot `/private/tmp/vsm-form-runtime-2026-05-16/form-runtime-job-type-create-form.png`.
  - Business Tree URL: `https://demo.platform.localhost/app/pages/business-tree`; title `Tenant Web`; app page rendered root company nodes; screenshot `/private/tmp/vsm-form-runtime-2026-05-16/business-tree-app-page.png`.
  - Business Tree interaction: expanding `Corporate @ Atlas Safety Holdings` rendered child nodes including divisions, contacts, and projects; screenshot `/private/tmp/vsm-form-runtime-2026-05-16/business-tree-expanded-atlas.png`.
  - Console health: no relevant `error` or `warn` logs observed during Form Runtime and Business Tree interactions.
- Tenant Form Runtime decomposition smoke:
  - Runtime table URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default`; `Job Type` table rendered rows, actions, search/filter toolbar, and pagination after decomposition; screenshot `/private/tmp/vsm-form-runtime-decomposition-2026-05-16/job-type-table-after-decomposition.png`.
  - Record view dialog opened from the first `View` row action after decomposition; screenshot `/private/tmp/vsm-form-runtime-decomposition-2026-05-16/record-view-after-decomposition.png`.
  - Create form URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default/new`; rendered `Online Form`, `Name`, `Active`, and `Finish` after decomposition; screenshot `/private/tmp/vsm-form-runtime-decomposition-2026-05-16/create-form-after-decomposition.png`.
  - Business Tree URL: `https://demo.platform.localhost/app/pages/business-tree`; expanding `Corporate @ Atlas Safety Holdings` rendered child nodes after decomposition; screenshot `/private/tmp/vsm-form-runtime-decomposition-2026-05-16/business-tree-after-decomposition.png`.
  - Console health: no relevant `error` or `warn` logs observed during post-decomposition Browser smoke.
- Tenant Form Runtime pure-helper decomposition smoke:
  - Runtime table URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default`; `Job Type` and `Manager` rendered; title `Tenant Web`; no framework overlay; console warn/error count `0`.
  - Create form URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default/new`; `Online Form`, `Name`, and `Finish` rendered; title `Tenant Web`; no framework overlay; console warn/error count `0`.
  - DOM interaction: clicked `Finish` through Browser DOM controls; alertdialog opened on the create route; console warn/error count `0`.
  - Business Tree URL: `https://demo.platform.localhost/app/pages/business-tree`; `Business Tree` and `Corporate @ Atlas Safety Holdings` rendered; title `Tenant Web`; no framework overlay; console warn/error count `0`.
  - Screenshot capture: attempted through Browser plugin, but `Page.captureScreenshot` timed out repeatedly in the current in-app browser session.
- Tenant Form Runtime mutation-controller extraction smoke:
  - Runtime table URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default`; `Job Type` and `Manager` rendered; title `Tenant Web`; no framework overlay; console warn/error count `0`.
  - Create form URL: `https://demo.platform.localhost/app/forms/jobtype/views/view-default/new`; `Online Form`, `Name`, and `Finish` rendered; title `Tenant Web`; no framework overlay; console warn/error count `0`.
  - DOM interaction: clicked `Finish`; alertdialog opened on the create route; console warn/error count `0`.
  - Business Tree URL: `https://demo.platform.localhost/app/pages/business-tree`; `Business Tree` and `Corporate @ Atlas Safety Holdings` rendered; title `Tenant Web`; no framework overlay; console warn/error count `0`.
  - Screenshot capture: attempted through Browser plugin, but `Page.captureScreenshot` timed out in the current in-app browser session.

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
- Navigation Builder Browser save/reload mutation was not run against the shared demo tenant. Add that later only with isolated seed data or an approved disposable tenant.
- Navigation Builder frontend is functionally split, but several files are large enough to create change-risk if more behavior is added without decomposition.
- Form Runtime browser/DB mutation paths were not run against the shared demo
  tenant. FE client contract tests now cover create/edit/finish/favorite/
  saved-filter/bulk/subform/checklist request shapes and backend error
  envelopes, while existing BE tests cover the server behavior. A true
  write-through browser/DB slice still needs a disposable tenant or explicit
  owner approval.
- Form Runtime has significant FE/BE file-size risk. The decomposition passes reduced the route page to 988 lines and extracted mutation plus subform/checklist controllers, but finish/back/dialog/reveal orchestration and DOM control sync remain concentrated; new non-trivial runtime-form behavior should still add targeted regression coverage before extending mutation flows.
