# Work

- Work ID: `2026-05-15-platform-stability-audit`
- Status: `in_progress`
- Owner goal: Improve stability of the VSM application by testing the tenant app frontend/backend module chain first, with admin deferred because it is not yet developed to the same depth.

## Understanding

The owner wants a stability-oriented audit before broad fixes. The current priority is the tenant app because it already contains the active product workflows: Platform Studio, Form Builder, Navigation Builder, form rendering/table output, and static information pages.

## Agreed Scope

- In: tenant app FE/BE stability testing, authenticated Browser Use smoke at `https://demo.platform.localhost/`, backend targeted checks for tenant modules, FE runtime/visual checks, and evidence-driven issue prioritization.
- Out: admin app deep testing, product-code edits, production email/SMS provider implementation, migrations, auth/tenant behavior changes, destructive operations, release/deploy, or broad refactors until an explicit execution slice is selected.

## Continuity Snapshot

- Latest owner correction: Start the next testing phase inside the tenant app; admin is deferred because it is still raw.
- Current phase: `tenant Form Builder Demo Presentation enhancement completed; checklist create-form filtering fix verified`
- Artifact path: `maestro/artifact/active/2026-05-15-platform-stability-audit/`
- Gates / approvals: Owner approved disposable Form Runtime mutation testing; no additional product-code, migration, release, or high-risk approval is open.
- Evidence status: Read-only command baseline, public FE Browser smoke, tenant authenticated Browser auth smoke, direct tenant auth/API probe, targeted Auth FE/BE code checks, Auth notification/provider review, tenant secure route wiring test, tenant Auth dependency Browser/API smoke, tenant Navigation Builder FE/BE/browser slice, tenant Form Runtime/table/App Pages FE/BE/browser slice, tenant Form Runtime decomposition-lite, tenant Form Runtime pure-helper decomposition, tenant Form Runtime mutation/subform controller extraction, tenant Form Runtime empty-create BE validation fix, owner-approved disposable API/DB mutation E2E, Demo Presentation Form Builder enhancement, and checklist create-form filtering fix completed.
- Unresolved owner decisions: None for read-only baseline.
- Next allowed action: Continue to the next tenant module testing slice; remaining Auth items are documented coverage/future-work gaps, not current blockers.

## Decisions

- Use one Maestro-coordinated stability audit, not separate independent FE and BE audits.
- Prefer vertical product/module slices for business logic stability, with horizontal FE-only or BE-only checks reserved for infrastructure surfaces.
- Defer deep admin testing; prioritize tenant app stability because active tenant workflows are more complete.

## Plan

1. Capture the current repository/product baseline and command health without making product-code changes.
2. Build a stability matrix covering backend, frontend, cross-stack contracts, auth/tenant/security, and UI/runtime evidence needs.
3. Prioritize the first vertical module slice from actual failures and known risk areas.
4. Only after the first slice is selected, move into scoped implementation and verification.

## First Tenant Stability Slice

- Slice: Tenant app authenticated shell plus Platform Studio runtime chain.
- Why first: all mature tenant workflows depend on profile bootstrap, runtime navigation, Platform Studio entrypoints, Form Builder, Navigation Builder, form runtime/table output, and static app pages.
- Backend surfaces: `cmd/api-tenant`, `modules/tenant/profile`, `modules/tenant/platformstudioformbuilder`, `modules/tenant/platformstudioformruntime`, `modules/tenant/platformstudionavigationbuilder`, `modules/tenant/apppages/businesstree`, and shared tenant/auth helpers as needed.
- Frontend surfaces: `apps/tenant-web/src/app/*`, `features/platform-studio/**`, `features/form-runtime/**`, `features/published-app/**`, `features/app-pages/**`, `packages/api-client`, `packages/auth-core`, `packages/tenant-core`, and `packages/platform-studio-core`.
- Evidence target: authenticated Browser Use smoke, API/bootstrap checks, targeted tenant FE tests, targeted tenant BE tests, and a prioritized issue matrix.

## Auth Code-Test Slice

- Scope: close the tenant Auth question before continuing to Platform Studio.
- Criteria:
  - Errors: targeted tests, type/lint/build where useful, obvious runtime/error-handling faults.
  - Logic: OTP request/verify, refresh/logout, profile bootstrap, tenant context, access-token handling, retry/recovery behavior, and no frontend-supplied tenant identity.
  - Boundaries: frontend `api-client`/`auth-core`/`tenant-web` responsibilities, backend `cmd/auth`/shared auth/session/tenant profile separation, and no handler-owned SQL or catch-all module growth.
  - Contract/security drift: `credentials: "include"`, HttpOnly refresh cookie, access token only in JS state, same-site paths, trusted tenant context, and profile/navigation responsibility split.
  - Coverage: identify what is tested, what is smoke-tested only, and what remains uncovered.
- Recorded findings:
  - OTP code is included in persisted audit event data; owner accepts this temporarily because real email/SMS delivery is not implemented yet.
  - OTP code generation is fixed for development-like environments and random only outside those environments.
  - Email/SMS delivery is debug-only; production provider implementation and prod config guard are separate future product work and are out of the current testing scope.
- Follow-up testing results:
  - Added backend route wiring coverage for tenant Auth-dependent routes: `/app/profile`, `/app/navigation`, `/app/platform-studio/navigation`, and `/app/platform-studio/forms/models` are registered as `TierSecure`.
  - Browser Use confirmed authenticated dashboard, Form Builder, and Navigation Builder entrypoints render without sign-in redirect or console warnings.
  - Direct unauthenticated probes confirmed `/app/profile`, `/app/navigation`, `/app/platform-studio/navigation`, and `/app/platform-studio/forms/models` return `401`.
  - Tenant sign-in component/integration test remains a known FE coverage gap; adding a DOM testing stack is out of the current testing scope.
  - Node warning was caused by login-shell PATH resolving `/usr/local/bin/node` v18.17.0 before `/opt/homebrew/bin/node` v22.22.1. The local machine was corrected at shell profile level (`~/.zprofile` and `~/.bash_profile`), while the project now fails fast through `.npmrc` `engine-strict=true` and keys Turbo cache on frontend Node/version-manager files.
- Next allowed action: move to the next tenant module test slice unless owner explicitly opens an Auth implementation slice.

## Navigation Builder Test Slice

- Scope: test tenant Navigation Builder as a vertical FE/BE stability slice.
- Criteria:
  - Errors: targeted backend/frontend tests, command health, browser console, route/API status, and rendered UI state.
  - Logic: authoring load/save, optimistic versioning, duplicate target prevention, app menu/utility rail active filtering, access strategies, parent-bounds-child behavior, runtime route projection, create actions, and direct target guards.
  - Boundaries: keep Navigation Builder behavior in `platformstudionavigationbuilder`, tenant-web Platform Studio UI, `@platform/platform-studio-core` contracts, and tenant shell runtime adapters; do not leak persistence into Form Builder or frontend-only authorization.
  - Monolith/modularity: check transport/service/repository split, derived runtime/access evaluator reuse, app/package boundaries, and large-file responsibility risk.
  - Runtime evidence: authenticated Browser Use smoke at `https://demo.platform.localhost/builder/navigation`, with app menu and utility rail interactions plus runtime shell checks.
- Results:
  - Backend Navigation Builder module and tenant server wiring targeted tests passed.
  - Adjacent Form Runtime, Business Tree app page, and Form Builder backend package tests passed to cover runtime target dependencies.
  - Frontend `api-client`, `platform-studio-core`, and `tenant-web` targeted lint/typecheck/tests passed for Navigation Builder state, runtime navigation, sidebar adapter, and published navigation adapter paths.
  - Authenticated Browser smoke at `/builder/navigation` passed for app menu, utility rail, add-item choices, selected inspector state, and console health.
  - No product-code fix slice is required from this pass.
- Findings:
  - No functional blocker found in the tested Navigation Builder path.
  - Frontend monolith risk remains: `navigation-builder-inspector.tsx`, `navigation-builder-state.ts`, `navigation-builder-page.tsx`, and `navigation-builder-tree-panel.tsx` are large enough that future feature work should consider decomposition before adding more responsibilities.
  - Browser smoke intentionally did not press Save to avoid mutating shared demo tenant data; backend service tests cover save/version/duplicate/root-only behavior.
  - `@platform/platform-studio-core` has lint/typecheck but no package-level test script; active backend-backed Navigation Builder behavior is currently covered through `api-client` and `tenant-web` tests.
- Next allowed action: move to the next tenant runtime slice, preferably Form Render + table output + static app pages, because those validate the routes and targets produced by Navigation Builder.

## Form Runtime / Tables / Static App Pages Test Slice

- Scope: test tenant runtime Form Views, generic table output, record view/form render, and static App Page routing after Navigation Builder exposure.
- Criteria:
  - Errors: targeted backend/frontend tests, type/lint checks, authenticated Browser smoke, console health, and unauthenticated API probes.
  - Logic: runtime table metadata/query, row actions, record view dialog, create form render, route title/breadcrumb from Navigation Builder, Business Tree app page load, and lazy tree expansion.
  - Boundaries: keep generic table behavior in `@platform/collection-table`, runtime form UI in `tenant-web/features/form-runtime`, form runtime APIs in tenant backend modules, and Business Tree as an App Page rather than a product module.
  - Monolith/modularity: check large FE/BE files before future runtime-form additions.
  - Security/access: runtime Form View and App Page APIs must stay behind tenant auth and Navigation Builder-derived guards.
- Results:
  - Backend targeted tests passed for Form Runtime, Form Builder runtime list/query support, Business Tree App Page, and tenant server wiring.
  - Frontend targeted tests/lint/typecheck passed for `api-client`, `forms`, `collection-table`, and `tenant-web` route/navigation coverage.
  - Browser smoke passed for Job Type runtime table, record view dialog, create form render, Business Tree App Page load, and Business Tree branch expansion.
  - Direct unauthenticated API probes returned `401` for runtime form meta/query/form and Business Tree nodes.
  - No product-code fix slice is required from this pass.
- Findings:
  - No functional blocker found in the tested Form Runtime/table/App Page path.
  - Strong monolith risk remains: `forms-runtime-form-page.tsx` is over 2000 lines; `collection-table-page.tsx`, `form-runtime-collection-table-client.ts`, `platformstudioformruntime/repository_write.go`, `platformstudioformruntime/service.go`, and `platformstudioformruntime/service_test.go` are large enough that future non-trivial runtime-form work should consider decomposition first.
  - Browser smoke intentionally did not submit a create/edit form or run bulk destructive actions; those require an approved disposable tenant or explicit mutation slice.
  - `@platform/collection-table` has tests but no package-level `test` script, so the package test was run directly with Vitest.
- Next allowed action: choose either a non-mutating runtime coverage expansion, an isolated disposable-tenant mutation slice for create/edit/bulk actions, or continue to another tenant module such as SOR/checklist runtime.

## Form Runtime Decomposition-Lite Slice

- Scope: reduce immediate frontend monolith pressure before any runtime mutation testing or new Form Runtime feature work.
- Criteria:
  - Preserve runtime behavior; no product contract, route, API, mutation, or styling change.
  - Move presentational dialog/load-error UI, runtime form labels, browser/geolocation helpers, and lookup dictionary helpers out of the route page.
  - Keep the main route page as orchestration-heavy for now, but make future handler/state extraction easier.
- Results:
  - Extracted `form-runtime/components/form-runtime-dialogs.tsx`.
  - Extracted `form-runtime/components/form-runtime-load-error.tsx`.
  - Extracted `form-runtime/use-runtime-form-labels.ts`.
  - Extracted `form-runtime/form-runtime-browser-helpers.ts`.
  - Extracted `form-runtime/form-runtime-lookup-helpers.ts`.
  - Reduced `forms-runtime-form-page.tsx` from roughly 2196 lines to 1799 lines without changing runtime behavior.
  - Targeted FE/BE checks and Browser smoke passed after extraction.
- Findings:
  - Monolith risk is reduced but not closed. The route page still owns autosave/create/edit/finish/subform/checklist orchestration and remains large.
  - Next decomposition step, before substantial mutation logic, should extract a state/action hook or controller around create/update/finish/autosave.
  - `collection-table-page.tsx` and BE `platformstudioformruntime` large files remain unchanged in this slice.
- Next allowed action: continue with a second Form Runtime decomposition slice focused on low-risk pure helper extraction before mutation orchestration, or proceed to disposable-tenant mutation testing with this residual risk accepted.

## Form Runtime Pure-Helper Decomposition Slice

- Scope: continue reducing route-page monolith risk without changing behavior or mutation orchestration.
- Criteria:
  - Preserve function bodies and call sites semantically; no product contract, route, API, mutation, or styling change.
  - Move pure value coercion/serialization, validation-message helpers, subform response mapping, runtime error classification, and navigation session state helpers out of the route page.
  - Do not extract autosave/create/edit/finish/subform/checklist controller logic in this step.
- Results:
  - Extracted `form-runtime/form-runtime-value-helpers.ts`.
  - Extracted `form-runtime/form-runtime-validation-helpers.ts`.
  - Extracted `form-runtime/form-runtime-subform-helpers.ts`.
  - Extracted `form-runtime/form-runtime-error-helpers.ts`.
  - Extracted `form-runtime/form-runtime-navigation-state.ts`.
  - Reduced `forms-runtime-form-page.tsx` from 1799 lines to 1492 lines after the first and second decomposition passes.
  - Targeted typecheck, lint, FE tests, BE tests, and authenticated Browser DOM/console smoke passed after extraction.
- Findings:
  - Runtime behavior was intentionally preserved; mutation/autosave/finish/controller code remains in the route page.
  - Browser screenshot capture timed out in the Browser plugin during this pass, but DOM snapshots, URL/title checks, console health, and a DOM-click Finish interaction passed.
  - `forms-runtime-form-page.tsx` is smaller but still orchestration-heavy. The next real monolith step should target mutation/controller extraction with tighter regression coverage.
- Next allowed action: extract a runtime mutation/controller boundary, or move to disposable-tenant mutation coverage if the owner accepts the remaining orchestration concentration.

## Form Runtime Mutation-Controller Extraction Slice

- Scope: reduce the largest remaining route-page concentration without changing runtime mutation behavior.
- Criteria:
  - Move create/update/autosave patch scheduling, mutation response application, request-error handling, server-validation handling, and create-time route replacement into a focused controller module.
  - Keep the same refs, state setters, payload fields, timer behavior, validation order, route paths, and API calls.
  - Leave page-owned UI orchestration in the route page: finish action, back/unsaved flow, field reveal/focus, subform navigation/delete shell, checklist item shell, DOM sync, and scaffold wiring.
- Results:
  - Extracted `form-runtime/form-runtime-mutation-controller.ts`.
  - `forms-runtime-form-page.tsx` reduced from 1492 lines to 1186 lines.
  - The controller currently owns `handleRuntimeRequestError`, `applyMutationResponse`, `applyInitialStatusIfNeeded`, `flushPendingPatch`, `schedulePatch`, and `createRecordIfReady`.
  - Targeted typecheck, lint, FE tests, BE tests, and authenticated Browser DOM/console smoke passed after extraction.
- Findings:
  - Mutation behavior was preserved by passing the existing refs/state setters/callbacks into the controller; no API payload, route, timer, or validation-order change was intended.
  - `forms-runtime-form-page.tsx` is now below the previous severe-risk range but still owns finish/subform/checklist/UI orchestration.
  - The new controller is cohesive but large enough that future mutation additions should add tests before extending it.
  - Browser screenshot capture still timed out in the Browser plugin; DOM snapshots, URL/title checks, console health, and Finish interaction evidence passed.
- Next allowed action: run disposable-tenant mutation coverage for create/edit/finish/favorite/saved-filter/bulk actions, or split checklist/subform controller logic if we want another non-mutating decomposition pass first.

## Form Runtime Mutation Contract Coverage Slice

- Scope: add safe automated coverage for the tenant Form Runtime mutation
  contract without mutating the shared demo tenant.
- Criteria:
  - Preserve product logic; add tests only.
  - Cover FE request contracts for create, edit, finish, favorite toggle,
    saved-filter create/delete, bulk action execution, auth headers, encoded
    runtime paths, and backend envelope error propagation.
  - Reuse existing backend package tests as the BE evidence layer for runtime
    create/update/finish/favorite/saved-filter/bulk behavior.
- Results:
  - Added
    `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-collection-table-client.test.ts`.
  - Covered runtime record mutation endpoint/method/body/header contracts for
    create, update, and finish.
  - Covered runtime table mutation endpoint/method/body/header contracts for
    favorite toggle, saved filters, and bulk actions.
  - Covered backend error-envelope propagation into `ApiClientError` for
    failed mutations.
  - Targeted tenant-web typecheck, lint, Vitest route tests, the new mutation
    contract test, and backend Form Runtime/Form Builder tests passed.
- Findings:
  - No product-code change was required in this slice.
  - This closes the safest automated FE-BE contract layer for runtime
    mutations, but it is not a real browser/DB write-through test.
  - Shared demo tenant mutation remains intentionally skipped. A full
    disposable-tenant E2E write slice can be added later when isolated seed data
    and cleanup rules are approved.
- Next allowed action: either run a true disposable-tenant E2E mutation slice,
  or move to the next tenant stability area such as checklist/subform runtime
  coverage.

## Form Runtime Checklist/Subform Coverage Slice

- Scope: close the next safe automated coverage gap around subform and
  checklist runtime contracts without changing product logic.
- Criteria:
  - Preserve product code; add test coverage only.
  - Cover FE client request contracts for subform load/create/update/delete and
    checklist item update.
  - Re-run existing BE tests that cover subform load/create/update/delete,
    subform unique validation, checklist render/upsert, Form Builder runtime
    subform planning, and tenant server routing.
- Results:
  - Extended
    `platform/frontend/apps/tenant-web/src/features/form-runtime/form-runtime-collection-table-client.test.ts`.
  - Covered parent-scoped subform endpoints, encoded `parentDocGuid`,
    `subformId`, child `docGuid`, checklist `sourceRef`, bearer auth headers,
    JSON bodies, and normalized responses.
  - Targeted tenant-web typecheck, lint, Vitest route/client tests, and backend
    Form Runtime/Form Builder/api-tenant server tests passed.
- Findings:
  - No product-code change was required in this slice.
  - This improves regression protection for the route-page residual
    finish/subform/checklist orchestration risk, but it still is not a rendered
    browser write-through test.
  - Shared demo tenant mutation remains intentionally skipped.
- Next allowed action: choose between true disposable-tenant E2E mutation
  coverage, a focused route-page checklist/subform controller extraction, or
  moving to another tenant module.

## Form Runtime Checklist/Subform Controller Extraction Slice

- Scope: reduce the remaining route-page concentration around nested runtime
  work without changing product behavior or touching tenant data.
- Criteria:
  - Preserve existing subform add/edit/delete, checklist update, save-state,
    dialog, route, and API call order.
  - Move parent-readiness, subform navigation/delete, checklist optimistic
    merge, and subform reload logic into a focused controller.
  - Add a pure helper regression test for checklist item state merging.
- Results:
  - Added `form-runtime/form-runtime-subform-controller.ts`.
  - Added `form-runtime/form-runtime-subform-helpers.test.ts`.
  - Extended `form-runtime-subform-helpers.ts` with
    `mergeRuntimeChecklistItemState`.
  - Reduced `forms-runtime-form-page.tsx` from 1186 lines to 988 lines.
  - Targeted FE typecheck, lint, Vitest route/client/helper tests, shared forms
    tests, backend Form Runtime/Form Builder/api-tenant server tests, and
    Browser render smoke passed.
- Findings:
  - No endpoint, mutation payload, route, translation key, or user-visible
    flow was intentionally changed.
  - Browser smoke confirmed the Job Type runtime table and create form still
    render after the extraction. The empty create-form Finish click then exposed
    a backend `500` for `jobtype` because DB `NOT NULL` constraints were not
    mapped back to runtime validation when metadata lacked `required`.
  - Residual route-page concentration is now mostly finish/back/dialog/reveal
    orchestration plus DOM sync; `form-runtime-mutation-controller.ts` remains
    the larger controller at 506 lines.
- Follow-up action taken: the empty-create backend validation bug is fixed in
  the next slice.

## Form Runtime Empty-Create BE Validation Fix Slice

- Scope: fix the backend runtime create path found by the empty Job Type
  Finish click without changing FE behavior, routes, payloads, schema, or seed
  data.
- Criteria:
  - Preserve successful create/update/finish behavior.
  - Do not add migrations or mutate demo tenant data.
  - Convert known runtime-field database `NOT NULL` failures into the existing
    `validationErrors` response contract instead of returning `500`.
- Results:
  - Added typed Postgres `23502` mapping in a focused Form Runtime repository
    error helper and wired it into the write path.
  - Mapped known constraint columns back to runtime fields in service
    validation response handling for create/update/finish root and subform
    mutations.
  - Added regression tests for DB not-null-to-validation mapping and the
    repository error wrapper.
  - Confirmed the demo DB mismatch: `public.jobtype.name` is `NOT NULL`, while
    `ps_model` runtime metadata for `jobtype.name` does not declare
    `required`.
- Findings:
  - The fix keeps the current metadata/seed state intact and makes runtime
    mutation handling resilient when physical schema constraints are stricter
    than Form Builder metadata.
  - The running local backend must be restarted before Browser Use can verify
    the new response in the app.
- Next allowed action: continue tenant stability testing, with true
  write-through browser/DB mutation coverage still requiring a disposable
  tenant or explicit owner approval.

## Form Runtime Disposable Mutation E2E Slice

- Scope: run the owner-approved mutation slice against disposable
  run-marked tenant data, without changing product logic or persistent seed
  data.
- Criteria:
  - Use local seeded tenant auth and real tenant runtime APIs.
  - Create only unique `codex-e2e-*` records and clean them up through runtime
    APIs.
  - Cover create record, edit/autosave API, finish, favorite toggle,
    saved-filter create/delete, bulk active/inactive/delete, subform
    create/edit/delete, and checklist update.
  - Verify DB cleanup leaves no disposable rows behind.
- Results:
  - Temporary script `/private/tmp/form-runtime-mutation-e2e.sh` passed.
  - Run ID: `codex-e2e-20260516195720`.
  - Published runtime route coverage passed for `jobtype`:
    create/edit/finish/favorite/saved-filter/bulk.
  - Platform Studio runtime preview coverage passed for `test-inspection`
    subform and `lookup` checklist because those forms are not exposed through
    published runtime navigation and the direct `/app/forms/...` guard returns
    `NAVIGATION_BUILDER_ACCESS_DENIED`.
  - Cleanup verified zero rows for the run marker in `jobtype`,
    `ps_test_inspection`, `ps_test_inspection__sf_9bcecc`, `ps_lookup`, and
    `ps_lookup__sf_a672a5`.
  - Browser post-check rendered the Job Type runtime table route with no
    console warnings/errors.
- Findings:
  - The API/DB mutation path is stable for the covered runtime operations.
  - Rendered-browser mutation evidence is still not valid in the current
    Browser session: Browser/CUA input can change the visible textbox value
    while React form state remains empty, so `Finish` still shows the expected
    required-field validation.
  - No product-code change was required from this E2E run.
- Next allowed action: continue to the next tenant stability area, or open a
  separate Browser-input/tooling issue if rendered mutation evidence becomes a
  hard requirement.

## Form Builder Demo Presentation Slice

- Scope: create a presentation-ready managed `Demo Presentation` model in the
  demo tenant while testing Form Builder FE/BE authoring, additive runtime
  apply, preview runtime list/form render, lookup selection wiring, and
  checklist rendering with `LOOKUP Option`.
- Results:
  - Created model `demo-presentation`, default view `view-default`, and
    additional view `view-executive-summary`.
  - Added root fields for overview/details plus a checklist subform
    `presentation_checklist` with `LOOKUP Option` item lookup source.
  - BE runtime apply created root/subform storage tables and data/grid views;
    DB metadata and information_schema checks confirmed expected columns,
    including lookup-derived label outputs.
  - Browser smoke confirmed Form Builder workspace and preview runtime create
    form render with console warn/error count `0`.
  - Found and fixed a Form Render ordering regression: standalone root nodes
    such as subforms were compiled before authored sections. Runtime now
    preserves authored root order, so Demo runtime renders `Demo overview`,
    `Presentation details`, then `Presentation checklist`.
- Scroll note:
  - The Codex browser page was not CSS-scroll-locked. With the checklist
    collapsed, the page was only about 44px taller than the viewport; after
    expanding checklist content, Browser wheel-scroll moved normally.
- Next allowed action: continue Form Builder testing with focused edit/save
  flows, or review/commit the current Demo Presentation and runtime-order fix.

## Form Builder Demo Presentation Enhancement Slice

- Scope: improve the tenant `Demo Presentation` model for presentation use
  while continuing FE/BE Form Builder and Form Render stability testing.
- Criteria:
  - Preserve product logic except for defects found during testing.
  - Mutate only demo tenant authoring/data needed for the presentation model.
  - Showcase stronger Form Builder capabilities: sections, text content, tabs,
    grid layout, choice buttons, lookup, tags/multi-select, ready-made
    email/url/date-time fields, checklist, default/runtime table columns, and
    an executive summary view.
- Results:
  - Enhanced `demo-presentation` default view to 19 root fields and 29 root UI
    nodes with `Demo overview`, `Demo story`, `Readiness`, `Assets and
    follow-up`, and `Presentation checklist`.
  - Added six demo-only `LOOKUP Option` records under catalog
    `Demo Presentation`; checklist now uses those source rows.
  - Runtime apply passed as `applied`; DB confirmed added columns, the managed
    multi-value table `ps_demo_presentation__mv`, and refreshed data/grid
    views.
  - Browser smoke confirmed builder, runtime list, runtime create form,
    checklist expansion, and console warn/error count `0`.
  - Found one BE runtime apply edge: reordering root `dataSchema.fields` can
    make PostgreSQL reject `CREATE OR REPLACE VIEW` due positional column-name
    changes. The model was stabilized by preserving the old physical field
    order and using UI nodes/layout for presentation order.
  - Found and fixed a checklist runtime bug: create forms with no saved
    checklist rows were loading all unfiltered lookup options as inactive
    saved items. Runtime now loads inactive saved options only when saved source
    values exist.
- Next allowed action: review/commit the Form Builder enhancement and fixes, or
  continue with focused Form Builder edit/save/browser mutation checks.

## Risks / Gates

- Auth/session, tenant isolation, permissions, migrations, seed data, and production/release actions require explicit approval before changes.
- A green FE-only or BE-only result is insufficient when the user-visible workflow depends on both sides.
- Broad refactoring before baseline evidence could hide regressions or make failures harder to attribute.
- Owner has authenticated in the in-app browser. Evidence must not record credentials or auth codes; use `Auth: local seeded dev login.` wording only.

## Agent / Tool Notes

- Keep work inline for the initial baseline.
- Use specialists only if a later slice needs separate research, implementation, verification, or review.
- Build Web Apps `frontend-testing-debugging` plus Browser plugin is approved for FE smoke and visual/runtime checks.

## Evidence

- `evidence.md`

## Next Action

Continue the next tenant stability slice. Candidate: another tenant module, or
a separate rendered-browser mutation tooling slice if UI-submit evidence becomes
required.
