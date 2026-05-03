# Work

- Work ID: `2026-04-30-runtime-form-builder`
- Status: `runtime_bulk_actions_slice_complete`
- Owner goal: Prepare the implementation path for reusable runtime add/edit forms opened from `CollectionTable` row `edit` and toolbar `Start New` actions, first for `tenant-web` and later for `platform-admin-web`.

## Understanding

The owner wants a modern schema-driven runtime form builder, not a copy of the legacy smart-app EJS runtime. The new runtime should render add/edit forms from Form Builder `dataSchema + layoutBlueprint + uiSchema`, reuse `ui-kit`/UI Lab visual patterns, live primarily in the shared frontend `forms` package, and connect to current tenant Form Builder runtime routes.

Managed and static/external runtime forms should use one behavior model:

- create: opening `/new` keeps local unsaved form state only; once all required fields are valid, the runtime creates the server record and then continues with field-level autosave;
- edit: opening `/edit/:docGuid` edits an existing server record and saves field changes as the user works;
- workflow status transitions must use the view-bound `systemFields.workflowStatus.initialValue/finalValue` values when present and valid, not hardcoded defaults;
- `Finish` is a lifecycle/runtime command boundary, not the creation trigger.

View/read remains the existing `CollectionTable` modal path for now.

## Agreed Scope

- In: architecture recommendation, codebase/reference inspection, first implementation slice proposal, package boundaries, API contract outline, risk gates.
- Current approved backend slice: add a dedicated tenant runtime service/package for root form create, edit/autosave patch, and finish command endpoints.
- Current approved frontend/runtime slice: align the mutation API response shape with the tenant-web adapter, wire create-after-required, patch autosave, and finish command calls on the runtime form page, and expose `Start New` plus `edit` from CollectionTable runtime metadata.
- Out for current backend slice: migrations, Navigation Builder ACL, Action Builder side effects, PDF/report behavior, subform writes, preview write routes, and broad runtime list/read migration out of `platformstudioformbuilder`.

## Decisions

- Use the legacy smart-app runtime as behavior reference only: dynamic template dispatch, autosave, required validation, status transition, subform/checklist, file/signature/rich text lessons. Do not copy EJS/jQuery architecture.
- Put reusable schema-driven rendering primitives and runtime controller helpers under `platform/frontend/packages/forms`; keep tenant route composition and API adapters in `tenant-web` until admin reuse proves the API stable.
- Keep `CollectionTable` generic. It should expose/consume route/action seams; app hosts resolve `Start New` and `edit` paths.
- Keep write APIs out of `platformstudioformbuilder` long term. The next backend runtime write slice should start `platformstudioformruntime` or a clearly bounded runtime subpackage decision.
- Owner approved starting the backend runtime write slice, with an explicit correction that new write behavior must live in a separate `platformstudioformruntime` service/module and not be added to `platformstudioformbuilder`.
- Keep `platformstudioformruntime` as the dedicated tenant runtime package, but split its internals by concern rather than growing one broad service file. Current seams are handler, service/public commands, auth/context, values/normalization, system-field defaults, lookup option hydration, validation, response assembly, runtime context/schema planning, repository reads, and repository writes. Future Access Builder and Action Builder work should attach through explicit policy/command boundaries instead of expanding `platformstudioformbuilder` or hiding action logic in the renderer.
- Use UI Kit `Field` responsive-inline layout for full-width runtime fields by default: label on the left and control on the right on desktop, then stacked label/control on mobile. Half-width grid fields remain stacked unless the field definition explicitly overrides `labelLayout`.
- Use UI Kit `Button` `secondary` variant for every runtime form `Back to list` / `Back` navigation action, both top and bottom.
- Runtime `Tabs` layout should follow UI Lab `Navigation Primitives / Tabs / Scrollable rail and initial tab`: `surface` tabs, `TabsList.scrollable`, and schema-driven initial tab support.
- Frontend visual verification should use Browser Use/in-app browser for interactive smoke, but responsive claims require fixed viewport evidence. Standard matrix: desktop `1440x900`, mobile `390x844`, and optional `768x1024` for breakpoint-sensitive shell/grid work.
- Replace the earlier `static/external create on Finish only` idea with a unified model for managed and static/external forms: create the record automatically after all required fields are complete, then autosave subsequent field changes.
- Runtime create must include System Fields when present: `Reported By` from the creating user, `Reported Date` from current server/client contract date, and `Status` from View Form Builder initial status after the record is first saved.
- The first create implementation should start with an in-form in-flight request guard so double clicks/retries do not send duplicate create requests from the UI. A server idempotency token is desirable only if it can be added without extra storage or heavy mechanics; it is not required for the first contract slice.
- After first successful create, replace the route from `/new` to `/edit/:docGuid` without visual disruption or remounting that would interrupt the user's work.
- `Finish` should be treated as a runtime command/action boundary. Today it may apply View Form Builder final status when valid; later Action Builder can own dynamic transitions, code-backed/static actions, side effects, and status rules based on current state.
- Current frontend `Finish` interaction should validate required fields before running the command, show a modal message, and move focus to the first incomplete field after the user acknowledges the modal. When validation passes, show a success modal; confirmation returns the user to the list. Future backend/Action Builder work may add server-side validation, dynamic status transitions, and post-actions behind the same command boundary.
- `Back to list` behavior: before the record is created, warn that entered data will be lost; after the record exists, return to the list and leave current status unchanged. If autosave is pending, wait for save completion before navigating instead of showing avoidable errors.
- Text-like runtime controls (`short_text`, numeric/date inputs, `long_text`, rich-text textarea fallback) commit changes on blur so slow typing does not create avoidable autosave requests; choice/toggle controls still commit immediately because their value change is the explicit action.
- Runtime form reads must hydrate the current option for single-value `contact_lookup` fields when a record/default value contains an id, allowing readonly and editable lookup controls to display the label without an initial per-field AJAX request.
- System Field bindings and `semanticRole` metadata do not automatically make a field readonly. They control runtime semantics such as create defaults and workflow/status commands. A runtime field is readonly only when the authored schema/view explicitly marks the field/node readonly. This allows owners to expose fields such as Reported By, Reported Date, or Status for user edits when the view is configured that way.
- Runtime list row actions should present `edit` before `view` when both actions are available.
- Runtime list checkbox/bulk action behavior must stay metadata-driven by the runtime surface, not inferred inside the generic `CollectionTable`. Show bulk `Active` / `No active` only when a supported `active` field exists in the source/schema, that field is present in the current view/table output, and the view permits edit.
- Runtime list `Delete` is its own bulk action and is available when the current view permits delete, independent of whether an `active` field exists. Because it is destructive, it needs explicit confirmation UX before execution.
- Next frontend field-scope slice should cover these Form Builder palette groups: `Basic fields`, `Choice fields`, core `Layout`, and `Content`.
- Do not include these groups in the next field-scope slice: `Relationships`, `System Fields` as visual palette/rendered controls, `Ready-made fields`, and reserved `Advanced fields`. System Field metadata still remains part of runtime create/status behavior when present on a view.
- For selected first-scope fields, include render-affecting settings only: label/display name, key/id, description/helper, placeholder/content, required/nullable, readonly/disabled/lock state, default value shape, width/layout/label layout, rows, numeric/date input behavior, choice options, choice orientation/control type where supported, and content alignment/style variants where needed.
- Include the accepted first-contract UI rules that affect runtime rendering and validation: same-scope `visibilityRules` and `requirementRules`. Defer full rule-engine breadth, dynamic option/data sources, field-to-field comparison, nested `or`, cross-scope dependencies, option style systems, and all Action Builder side effects.
- `Section` is the runtime form card. If a root form scope has no authored `Section`, the renderer should create one default card around all root fields.
- Treat `Subform` as a separate follow-up slice, not part of the first field-scope renderer expansion. It introduces a child table in the parent form, child add/edit routes that open the subform scope as a first-level child form page, `Back` returning to the parent form, `Save` instead of `Finish`, no child System Fields/workflow status, and future optional post-processing/actions.

## Plan

1. Build a frontend-only renderer scaffold with fixture data: a bounded representative field/layout matrix, no create/autosave/finish API calls, no backend package changes, no migrations, and no ACL/grant work.
2. Add tenant runtime route skeletons for `/new` and `/edit/:docGuid`, wired host-side from `CollectionTable` create/edit route seams, rendering placeholder or fixture-backed form states only.
3. Refactor `@platform/forms` from the current single-file scaffold into a field-renderer structure: shared runtime types, validation/rule helpers, common field wrapper, and separate renderer modules per field family.
4. Expand frontend fixture/UI coverage for agreed first field scope: Basic fields, Choice fields, core Layout, Content, and simple same-scope visibility/requirement rules.
5. Define a unified read/create/autosave/finish API contract for managed and static/external source modes: create after required-complete, edit autosaves, and `Finish` runs lifecycle/action behavior.
6. Implement runtime create with required validation, System Field defaults, in-form duplicate request guard, route replace to `/edit/:docGuid`, dirty/saving state, conflict handling, and workflow status mapping.
7. Implement runtime edit autosave for managed and static/external records with the same field-change controller where backend capability allows it.
8. Add browser/Storybook/UI Lab visual evidence and targeted FE/BE tests before rollout.

## First Slice Acceptance

- Existing runtime list and view modal keep working.
- `/app/forms/:modelId/views/:viewId/new` and `/app/forms/:modelId/views/:viewId/edit/:docGuid` render route-level scaffold or fixture-backed form states.
- `CollectionTable` remains generic; tenant-web owns create/edit path resolution.
- `@platform/forms` has no app imports and exports only through its public entrypoint.
- Fixture matrix covers a small representative set first: text, textarea/rich text display, number/date, select/radio/checkbox-style choice, readonly/system display, simple section/group layout, and validation/error state.
- Autosave/create/finish controls are visibly modeled as UI states only; they do not call backend write APIs in the first slice.

## Next Frontend Renderer Slice Checklist

- Implementation status: completed for the current frontend renderer slice; keep this checklist as the durable scope record and do not reinterpret deferred items as done.
- Preserve the accepted create/edit behavior: create after required-complete, edit autosaves, `Finish` is lifecycle/action.
- Refactor `@platform/forms` into modules before adding more field behavior:
  - shared runtime types;
  - rule/validation/value helpers;
  - common field wrapper;
  - separate field renderers;
  - layout renderers;
  - content renderers;
  - fixture matrix.
- First renderer scope:
  - Basic fields;
  - Choice fields;
  - core Layout without `Subform`;
  - Content;
  - same-scope visibility and requirement rules.
- Deferred renderer scope:
  - Relationships;
  - System Fields as visual palette controls;
  - Ready-made fields;
  - Advanced fields;
  - dynamic data sources;
  - full option styling;
  - Action Builder side effects.
- Section/card rule: `Section` is the runtime card; if no root `Section` exists, create one default card around all root fields.

## Deferred Subform Slice Notes

- `Subform` renders as a child table inside the parent form.
- Child `Add` and `Edit` open a subform-scope form page by separate route, using the same create-after-required-complete and edit-autosave principles as root forms.
- Subform page actions are `Back` and `Save`, not `Back to list` and `Finish`.
- `Back` returns to the parent form route without changing parent status.
- If the subform was opened from inside a parent tab, the child route should carry the parent tab context and restore that same tab when returning with `Back`.
- Subform scope has no System Fields and no workflow status game.
- Future post-processing/actions may exist, but they belong to the future Action Builder/runtime command layer, not the first subform renderer slice.

## Risks / Gates

- Backend runtime writes affect tenant data and source-table behavior; implementation requires an explicit execution decision and backend contract update.
- Static/external tables must not be treated as Form Builder-owned managed storage, but their runtime form UX should still follow the same create-after-required-complete and edit-autosave model when backend capability supports writes.
- Workflow status must use the View Form Builder `systemFields.workflowStatus.initialValue/finalValue` binding only when a compatible status field exists.
- Navigation Builder runtime grants are still planned; do not invent temporary grants.
- Runtime create/edit writes need conflict handling, required validation, System Field defaults, in-flight create guarding, route replacement behavior, pending-save navigation behavior, and tenancy rules defined before backend work.
- `Finish` integration must leave room for Action Builder; do not bake final status as renderer-only behavior.
- Subform is a separate nested-scope/table/route behavior and must not be hidden inside the basic Layout renderer expansion.

## Agent / Tool Notes

- Inspected current active contracts/memory, tenant runtime list/read code, collection-table action seams, `forms` package boundary, `ui-kit`/UI Lab rules, backend runtime routes, and `reference-pack:smartapp-runtime` `edit.html`/EJS templates.
- Grant audit completed with verdict `revise`: plan direction is right, but first implementation must be narrowed to a frontend-only scaffold/fixture matrix before any backend writes.
- Added `maestro/memory/modules/frontend/build-web-apps-review.md` as the repo-local bridge for using official Build Web Apps capabilities in future frontend work. Maestro skill now points to that bridge instead of relying on local plugin cache paths.

## Evidence

- Secondary review used the cached Build Web Apps `frontend-app-builder` and `react-best-practices` guidance as review references. `shadcn`, `Stripe`, and `Supabase` guidance were not applicable to this UI-kit-only, no-write frontend slice.
- Secondary review follow-up fixes:
  - workflow status helper now refuses status values outside the bound field options;
  - readonly/system values are labelled via `aria-labelledby` instead of label `for` on non-labelable elements;
  - runtime list now relies on route resolution for frontend row actions, so unknown frontend actions are not enabled by a catch-all host handler.
- `pnpm --filter @platform/forms typecheck` passed.
- `pnpm --filter @platform/forms test` passed: 1 file, 4 tests.
- `pnpm --filter @platform/forms lint` passed.
- `pnpm --filter @platform/tenant-web typecheck` passed.
- `pnpm --filter @platform/tenant-web lint` passed.
- `pnpm --filter @platform/tenant-web test` passed: 6 files, 23 tests.
- `scripts/preflight.sh` passed in lite mode.
- HTTP smoke passed: `curl -k -I https://demo.platform.localhost/app/forms/sor/views/default/new` returned `200`.
- Visual smoke passed in Chrome on `https://demo.platform.localhost/app/forms/sor/views/default/new`: scaffold rendered, empty create state showed required validation on `Finish`.
- Visual smoke passed in Chrome on `https://demo.platform.localhost/app/forms/sor/views/default/edit/demo-doc-guid`: edit fixture rendered prefilled fields and status display.
- Styling follow-up passed: full-width fields now default to UI Kit `responsive-inline`; Chrome smoke confirmed the `Comment` label renders left of its textarea on desktop while preserving the mobile-stacking UI Kit behavior.
- Styling follow-up extended: added a full-width single-line `Reference note` fixture field for layout checks. In-app browser smoke confirmed both `Reference note` and `Comment` use the desktop inline layout, with full-width labels aligned near the top edge of their controls instead of vertically centered against textarea height.
- Visual verification rule recorded in `maestro/memory/modules/frontend/build-web-apps-review.md`, `maestro/memory/START_HERE.md`, `platform/frontend/AGENTS.md`, and Maestro skill notes: Browser Use is the default interactive smoke surface; Chrome/Computer Use is fallback or secondary; responsive evidence must use fixed viewport dimensions and should not rely on current panel width.
- Owner decision captured: managed and static/external forms should not have separate create semantics. New records are created only after all required fields are complete, then the form continues with autosave; `Finish` remains a lifecycle/action boundary for final status and future Action Builder behavior.
- Owner field-scope direction captured: next frontend renderer pass includes Basic fields, Choice fields, core Layout, and Content; excludes Relationships, System Fields as visual controls, Ready-made fields, Advanced fields, and Subform. `Section` is the form card; missing root sections get one default card.
- Frontend renderer module slice completed:
  - `@platform/forms` runtime code is split into a public facade plus runtime types, labels, value utilities, rule/validation helpers, scaffold, layout/content renderers, and separate field renderer modules.
  - Fixture matrix now covers Basic fields, Choice fields, core Layout without `Subform`, Content nodes, full-width inline fields, tabs/accordion/divider/grid layout examples, and simple same-scope visibility/requirement rules.
  - `show when` visibility rules are hidden by default until their condition matches; validation now walks nested layout nodes and respects visibility/requirement rules.
- Owner refinement captured: Back navigation actions use the secondary button style; runtime tabs use the UI Lab scrollable surface rail with schema-driven initial tab, and future Subform Back must restore the parent tab that launched the subform.
- Runtime tabs refinement completed: `RuntimeFormTabsLayoutDefinition` now supports `defaultTabId`, `styleVariant`, `size`, and `scrollable`; fixture tabs use the UI Lab surface/scrollable pattern and open on the schema-selected `Review` tab.
- Fixture coverage extended with additional first-scope examples: heading content, group layout, spacer layout, helper text, disabled text field, readonly field, stacked radio choices, extra single-select/multi-select/numeric/currency examples, and a longer scrollable tab rail.
- Form chrome refinement completed: top `Back to list` uses the same secondary button size as the footer action; visual form title/description header is hidden because the route context was low-value on the edit surface; idle `Ready` status is hidden and save-state status is reserved for meaningful dirty/saving/saved/error feedback.
- Current renderer slice checks:
  - `pnpm --filter @platform/forms typecheck` from repo root is blocked by the local root-owned runtime folder `platform/frontend/.local/config/caddy`; reran scoped checks from `platform/frontend` to avoid that unrelated dev-runtime permission issue.
  - `pnpm -C platform/frontend --filter @platform/forms typecheck` passed.
  - `pnpm -C platform/frontend --filter @platform/forms test` passed: 1 file, 7 tests.
  - `pnpm -C platform/frontend --filter @platform/forms lint` passed.
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck` passed.
  - `pnpm -C platform/frontend --filter @platform/tenant-web lint` passed.
  - `pnpm -C platform/frontend --filter @platform/tenant-web test` passed: 6 files, 23 tests.
  - `scripts/preflight.sh` passed in lite mode.
  - HTTP smoke passed: `curl -k -I https://demo.platform.localhost/app/forms/sor/views/default/new` returned `200`.
  - HTTP smoke passed: `curl -k -I https://demo.platform.localhost/app/forms/sor/views/default/edit/demo-doc-guid` returned `200`.
  - In-app browser smoke passed on `https://demo.platform.localhost/app/forms/sor/views/default/edit/demo-doc-guid`: active tab restored from schema initial tab as `Review`, one surface scrollable tab list rendered, `Review result` field rendered, `External ticket` field rendered, and both `Back to list` buttons used the secondary button class.
  - Form chrome smoke passed on the same edit route: `Edit record` heading count `0`, route description count `0`, idle `Ready` status count `0`, `Back to list` button count `2`, secondary back button count `2`, and small secondary back button count `0`.
- Finish dialog frontend behavior completed:
  - `/new` `Finish` validates required fields, opens the error modal `Please fill field: "Location"`, and `OK` returns focus to `runtime-form-fixture-sor-default-location`;
  - `/edit/demo-doc-guid` `Finish` opens the success modal `Successfully saved to server.`, and `OK` navigates back to `/app/forms/sor/views/default`;
  - this is fixture/frontend command behavior only and does not call backend write APIs.
- Build Web Apps / React Best Practices follow-up completed:
  - finish modals were restyled toward the uploaded legacy reference proportions: a restrained rectangular result dialog, large outline status icon, clear vertical spacing between icon/message/action, and lightweight CSS mark animation with reduced-motion fallback;
  - `@platform/forms` renderer cleanup fixed the `columns: 3` grid CSS contract and removed the unused `bindingLabel` type field from the first-slice content contract.
- Finish dialog follow-up checks passed:
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`;
  - `pnpm -C platform/frontend --filter @platform/forms lint`;
  - `pnpm -C platform/frontend --filter @platform/forms test`: 1 file, 7 tests;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`;
  - `pnpm -C platform/frontend --filter @platform/tenant-web lint`;
  - `pnpm -C platform/frontend --filter @platform/tenant-web test`: 6 files, 23 tests;
  - `scripts/preflight.sh` passed in lite mode;
  - `git diff --check` passed.
- Reference modal follow-up checks passed:
  - in-app browser visual smoke confirmed both error and success dialogs render with larger animated status icons and reference-like spacing/proportions;
  - owner approved the final proportional scale-down of the dialog, icon, spacing, text, and button treatment;
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`, `lint`, and `test` passed;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test` passed;
  - `scripts/preflight.sh` passed in lite mode;
  - `git diff --check` passed.
- Frontend closeout self-review completed:
  - nested runtime `grid` layout now renders child nodes through a full-width grid-content wrapper so authored `columns: 1/2/3` applies to the actual children instead of collapsing into the first parent column;
  - group/tabs/accordion layout wrappers now explicitly use column flex layout so their internal gaps are reliable;
  - removed non-functional SVG `stroke-dash*` declarations from the CSS-drawn success check pseudo-element while preserving the lightweight animation;
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`, `lint`, and `test` passed: 1 file, 7 tests;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test` passed: 6 files, 23 tests;
  - `scripts/preflight.sh` passed in lite mode;
  - `git diff --check` passed.
- Backend runtime write slice started:
  - accidental transitional write edits in `platformstudioformbuilder` were removed before continuing;
  - added dedicated `platformstudioformruntime` tenant package with its own handler/service/repository boundary;
  - added real runtime write routes for `POST /app/forms/{modelId}/views/{viewId}/records`, `PATCH /app/forms/{modelId}/views/{viewId}/records/{docGuid}`, and `POST /app/forms/{modelId}/views/{viewId}/records/{docGuid}/finish`;
  - create applies required validation before insert and injects bound System Field defaults for Reported By, Reported Date, and initial workflow status when compatible;
  - edit patch saves provided field values on an existing record and supports optional `expectedRevision` conflict checking;
  - finish is kept as a command boundary and currently applies a valid configured final workflow status without adding Action Builder side effects;
  - `go test ./modules/tenant/platformstudioformruntime` passed;
  - `go test ./cmd/api-tenant/internal/server` passed;
  - `go test ./modules/tenant/platformstudioformruntime ./cmd/api-tenant/internal/server` passed;
  - `git diff --check` passed;
  - `scripts/preflight.sh` passed in lite mode.
- Runtime write + tenant-web adapter slice completed:
  - tenant-web adapter now normalizes the create/edit/finish mutation response shape: `created`, `docGuid`, `revision`, `status`, `validationErrors`, and `values`;
  - `/new` now keeps local state until required validation passes, sends `POST /app/forms/{modelId}/views/{viewId}/records`, guards duplicate in-form creates, and replaces the route to `/edit/:docGuid` with restored session state after the first successful create;
  - `/edit/:docGuid` now batches field changes into debounced `PATCH /app/forms/{modelId}/views/{viewId}/records/{docGuid}` calls and tracks revision for conflict-capable requests;
  - `Finish` validates required fields, focuses the first invalid field after acknowledgement, flushes pending autosave, calls `POST /app/forms/{modelId}/views/{viewId}/records/{docGuid}/finish`, and keeps the success modal return-to-list behavior;
  - `Back to list` warns before leaving a not-yet-created dirty create form and waits for pending autosave before navigating away from an existing record;
  - runtime list metadata now exposes toolbar create/`Start New` when `canAdd` and GUID support allow it, and row `edit` alongside `view` when `canEdit` and GUID support allow it;
  - backend contract docs now record the mutation request/response shape and the current `clientCreateToken` limitation: accepted as a frontend session key, but storage-backed replay idempotency remains deferred;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test` passed: 6 files, 23 tests;
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`, `lint`, and `test` passed: 1 file, 7 tests;
  - `go test ./modules/tenant/platformstudioformbuilder ./modules/tenant/platformstudioformruntime ./cmd/api-tenant/internal/server` passed;
  - HTTP route smoke passed: list, new, and edit runtime form routes returned `200`;
  - `git diff --check` passed;
  - `scripts/preflight.sh` passed in lite mode;
  - fixed-viewport Browser Use smoke was not available in this turn because the Browser Use tool was not exposed and Codex app capture is disallowed; no real create/finish browser write smoke was run.
- Real runtime schema/data + hardening slice completed:
  - added form read contract/routes for `GET /app/forms/{modelId}/views/{viewId}/form` and `GET /app/forms/{modelId}/views/{viewId}/records/{docGuid}/form`;
  - backend form read returns raw Form Builder `dataSchema`, `uiSchema`, record/default `values`, `revision`, and surface metadata for tenant-web runtime compilation;
  - `clientCreateToken` now has storage-backed idempotency when it is a UUID: managed/static creates insert it through the runtime GUID column and duplicate-token unique violations load and return the existing record;
  - `@platform/forms` now includes a raw schema compiler for the agreed first slice: Basic fields, Choice fields, Layout sections/cards/groups/grids/tabs/accordion/divider/spacer, Content nodes, workflow status binding, required/visibility rules, and system-field readonly behavior when present in the view metadata;
  - tenant-web form page now loads real schema/data from the runtime API instead of the fixture, maps server validation responses into field errors/dialogs, and shows conflict UX for `409` runtime conflicts without replacing it with a generic save failure.
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`, `lint`, and `test` passed: 1 file, 8 tests;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test` passed: 6 files, 23 tests;
  - `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./cmd/api-tenant/internal/server` passed;
  - `git diff --check` passed;
  - `scripts/preflight.sh` passed in lite mode;
  - Browser Use smoke in Codex in-app browser passed on `https://demo.platform.localhost/app/forms/test-inspection/views/view-default/edit/bd1c5d5e-6692-4c75-9fbd-84494cd7cd68`: real `Test Inspection` schema/data rendered with Back/Finish controls and persisted record values;
  - Browser Use smoke also opened `/new`; current `test-inspection` schema has no required fields, so pressing `Finish` followed the create/finish path and created demo record `f98f379e-6b63-498c-a000-9e915f12e548`. No delete/cleanup was performed because deletion needs an explicit owner confirmation.
- Runtime form UX follow-up completed:
  - text-like field renderers now keep a local draft and commit to the runtime controller on `blur` instead of every `change`;
  - `db_lookup` single-value fields now compile as single-select controls even when they are not bound as a System Field, fixing copied views that include `Reported By` as a normal field;
  - backend form reads now append the current `contact_lookup` option to `dataSchema.rootScope.fields[].options`, so `Reported By` can render a display label instead of raw id;
  - runtime list metadata/test contract now preserves `edit` before `view`;
  - `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./cmd/api-tenant/internal/server` passed;
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`, `lint`, and `test` passed: 1 file, 8 tests;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test` passed: 6 files, 23 tests;
  - Browser Use smoke passed on `view-default/edit/bd1c5d5e-6692-4c75-9fbd-84494cd7cd68`: `Reported By` renders as `Demo Admin`, not raw id;
  - Browser Use smoke passed on `view-test-inspection-copy/edit/bd1c5d5e-6692-4c75-9fbd-84494cd7cd68`: copied view includes `Reported By` as a combobox with selected `Demo Admin`;
  - Browser Use smoke passed on `view-test-inspection-copy` list: `Start New` is visible and row actions render `Edit` before `View`;
  - `git diff --check` passed;
  - `scripts/preflight.sh` passed in lite mode.
- Reported By mode consistency follow-up:
  - default view rendered `Reported By` readonly because `uiSchema.rootScope.systemFields.reportedBy` was present;
  - copied view rendered it as an editable select because the copied view payload omitted that system-field binding, even though the field carried `semanticRole: reportedBy`;
  - owner clarified the final rule: system metadata must not force readonly; editable vs readonly is controlled by explicit authored schema/view readonly settings;
  - compiler now leaves `reportedBy`, `reportedDate`, and workflow/status fields editable unless the node/field is explicitly readonly;
  - `pnpm -C platform/frontend --filter @platform/forms typecheck`, `lint`, and `test` passed: 1 file, 8 tests;
  - Browser Use smoke passed on `view-test-inspection-copy/edit/bd1c5d5e-6692-4c75-9fbd-84494cd7cd68`: `Reported By` is visible with label hydration and follows the authored editable/readonly setting.
- Pre-commit runtime package structure review completed:
  - `platformstudioformruntime/service.go` now keeps the public runtime commands and root scope loading focused;
  - moved auth/context, mutation value normalization, System Field defaults/status helpers, lookup option hydration, validation, and response assembly into separate runtime files inside the same package;
  - no behavior/API change was intended; this establishes narrow future homes for access policy and action command work;
  - `go test ./modules/tenant/platformstudioformruntime` passed;
  - `go test ./modules/tenant/platformstudioformruntime ./modules/tenant/platformstudioformbuilder ./cmd/api-tenant/internal/server` passed;
  - `git diff --check` passed;
  - `scripts/preflight.sh` passed in lite mode.
- Runtime list checkbox/bulk action slice completed:
  - generic `CollectionTable` bulk actions now support optional confirmation metadata and pending action state without hardcoding runtime action semantics;
  - runtime list metadata enables checkbox selection when record GUID support exists and at least one current-view bulk action is available;
  - `Active` / `No active` bulk actions are emitted only when the current view list output includes a supported boolean `active` field and the view allows edit;
  - `Delete` is emitted when the view allows delete, independent of `active`, and carries confirmation metadata before execution;
  - tenant-web adapter posts runtime bulk actions to `POST /app/forms/{modelId}/views/{viewId}/bulk-actions/{actionId}`;
  - `platformstudioformruntime` executes `active`, `inactive`, and physical `delete` bulk actions by selected record GUIDs; delete removes known child subform rows before root records, and preview runtime metadata suppresses bulk actions;
  - contract docs now record the confirmation shape, runtime bulk endpoint, and active/delete metadata rules;
  - `go test ./modules/tenant/platformstudioformbuilder ./modules/tenant/platformstudioformruntime ./cmd/api-tenant/internal/server` passed;
  - `pnpm -C platform/frontend --filter @platform/collection-table typecheck` and `lint` passed;
  - `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test` passed: 6 files, 23 tests;
  - `pnpm -C platform/frontend --filter @platform/platform-admin-web typecheck`, `lint`, and `test` passed: 6 files, 27 tests;
  - `git diff --check` passed;
  - `scripts/preflight.sh` passed in lite mode;
  - Browser Use smoke was not run because the Browser Use tool was not exposed in this turn and Computer Use is not allowed to drive the Codex app; Chrome was intentionally avoided.

## Next Action

Next allowed action is owner review of the runtime list bulk action behavior, commit preparation for this slice, or an owner decision to continue into required-field authoring, broader lookup source behavior, access policy, or Action Builder command design.
