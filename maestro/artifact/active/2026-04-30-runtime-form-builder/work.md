# Work

- Work ID: `2026-04-30-runtime-form-builder`
- Status: `first_slice_complete`
- Owner goal: Prepare the implementation path for reusable runtime add/edit forms opened from `CollectionTable` row `edit` and toolbar `Start New` actions, first for `tenant-web` and later for `platform-admin-web`.

## Understanding

The owner wants a modern schema-driven runtime form builder, not a copy of the legacy smart-app EJS runtime. The new runtime should render add/edit forms from Form Builder `dataSchema + layoutBlueprint + uiSchema`, reuse `ui-kit`/UI Lab visual patterns, live primarily in the shared frontend `forms` package, and connect to current tenant Form Builder runtime routes.

The form has two write modes:

- managed runtime add/edit: autosave field changes to the server; create a new record on first meaningful change only after the backend write contract is approved; workflow status transitions must use the view-bound `systemFields.workflowStatus.initialValue/finalValue` values when present and valid, not hardcoded defaults;
- static/external table add: do not create until `Finish`; required fields must pass before submit.

View/read remains the existing `CollectionTable` modal path for now.

## Agreed Scope

- In: architecture recommendation, codebase/reference inspection, first implementation slice proposal, package boundaries, API contract outline, risk gates.
- Out: backend write endpoints, migrations, release, Navigation Builder ACL, Action Builder side effects, PDF/report behavior.

## Decisions

- Use the legacy smart-app runtime as behavior reference only: dynamic template dispatch, autosave, required validation, status transition, subform/checklist, file/signature/rich text lessons. Do not copy EJS/jQuery architecture.
- Put reusable schema-driven rendering primitives and runtime controller helpers under `platform/frontend/packages/forms`; keep tenant route composition and API adapters in `tenant-web` until admin reuse proves the API stable.
- Keep `CollectionTable` generic. It should expose/consume route/action seams; app hosts resolve `Start New` and `edit` paths.
- Keep write APIs out of `platformstudioformbuilder` long term. The next backend runtime write slice should start `platformstudioformruntime` or a clearly bounded runtime subpackage decision.
- Use UI Kit `Field` responsive-inline layout for full-width runtime fields by default: label on the left and control on the right on desktop, then stacked label/control on mobile. Half-width grid fields remain stacked unless the field definition explicitly overrides `labelLayout`.
- Frontend visual verification should use Browser Use/in-app browser for interactive smoke, but responsive claims require fixed viewport evidence. Standard matrix: desktop `1440x900`, mobile `390x844`, and optional `768x1024` for breakpoint-sensitive shell/grid work.

## Plan

1. Build a frontend-only renderer scaffold with fixture data: a bounded representative field/layout matrix, no create/autosave/finish API calls, no backend package changes, no migrations, and no ACL/grant work.
2. Add tenant runtime route skeletons for `/new` and `/edit/:docGuid`, wired host-side from `CollectionTable` create/edit route seams, rendering placeholder or fixture-backed form states only.
3. Define read/create/autosave/finish API contracts for managed and static/external source modes.
4. Implement managed autosave with debounced field patching, dirty/saving/error state, conflict handling, and workflow status mapping.
5. Implement static/external submit-on-finish flow with required validation and no draft record creation.
6. Add browser/Storybook/UI Lab visual evidence and targeted FE/BE tests before rollout.

## First Slice Acceptance

- Existing runtime list and view modal keep working.
- `/app/forms/:modelId/views/:viewId/new` and `/app/forms/:modelId/views/:viewId/edit/:docGuid` render route-level scaffold or fixture-backed form states.
- `CollectionTable` remains generic; tenant-web owns create/edit path resolution.
- `@platform/forms` has no app imports and exports only through its public entrypoint.
- Fixture matrix covers a small representative set first: text, textarea/rich text display, number/date, select/radio/checkbox-style choice, readonly/system display, simple section/group layout, and validation/error state.
- Autosave/create/finish controls are visibly modeled as UI states only; they do not call backend write APIs in the first slice.

## Risks / Gates

- Backend runtime writes affect tenant data and source-table behavior; implementation requires an explicit execution decision and backend contract update.
- Static/external tables must not be treated as Form Builder-owned managed storage.
- Workflow status must use the View Form Builder `systemFields.workflowStatus.initialValue/finalValue` binding only when a compatible status field exists.
- Navigation Builder runtime grants are still planned; do not invent temporary grants.
- Managed autosave needs conflict, abandon-draft, first-change-create, required validation, and tenancy behavior defined before backend work.
- Static/external submit-on-finish needs a backend contract before any write implementation.

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

## Next Action

Next gated slice should define the backend runtime write contract before implementing managed autosave or static/external submit-on-finish writes. Backend runtime writes require a separate owner decision.
