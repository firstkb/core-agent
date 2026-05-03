# Findings

This file tracks owner-discovered issues and observations from manual testing
around the runtime form builder, Form Builder views, and runtime list surfaces.
Only items explicitly selected for the current slice should be pulled into the
implementation plan.

Statuses:

- `triage`: recorded, not yet scoped.
- `current-slice`: approved for the active implementation slice.
- `next-slice`: accepted follow-up, not part of the active slice.
- `blocked`: waiting on an owner decision or prerequisite.
- `resolved`: fixed and verified.

## FB-RT-001 - Sorting field pickers should use grid output fields

- Area: Form Builder View tab Sorting and Subtable sorting.
- URL: `https://demo.platform.localhost/builder/forms/test-inspection/views/view-test-inspection-copy`
- Model/View: `test-inspection` / `view-test-inspection-copy`; affected root view grids and subform grids.
- Symptom: Sorting field pickers can select fields that are not included in the current grid output.
- Expected: Root View Sorting and Subtable sorting should show only fields that are active/included in the current Grid output for that scope.
- Actual: A non-grid-output field can be selected for sorting, which can later produce runtime/backend mismatch behavior.
- Evidence: Owner manual testing in Form Builder on 2026-05-03; owner reconfirmed the same rule for Subtable sorting on 2026-05-03.
- Priority: high.
- Status: resolved.
- Owner decision: Sorting UX should be constrained by fields included in Grid output for root views and subform subtables.
- Resolution: Sorting options now come only from active/list-visible Grid output fields for the current root or subform scope, including visible lookup-derived outputs. Invalid sort fields are cleared when a column is hidden/removed, and backend runtime-list default sort ignores sort fields outside active grid projections.
- Fixed in: `3f17fda`.
- Verification: `pnpm --filter @platform/tenant-web test -- form-builder-workspace-grid.test.ts` passed; `pnpm --filter @platform/tenant-web typecheck`, `lint`, and `test` passed; `go test ./modules/tenant/platformstudioformbuilder` passed; `scripts/preflight.sh` passed.

## FB-RT-002 - View resave warning no longer preloads pending field changes

- Area: Form Builder, Default View change propagation to other views.
- URL: `https://demo.platform.localhost/builder/forms/test-inspection/views/view-test-inspection-copy`
- Model/View: `test-inspection` / affected non-default views after Default View field changes.
- Symptom: After adding, changing, or deleting a field in Default View, other views show the yellow warning triangle that indicates the view needs to be opened and resaved, but opening the view no longer highlights newly added fields or enables Save automatically.
- Expected: When a view requires resave after Default View field changes, opening that view should immediately show the pending added/changed fields and enable Save, matching the previous behavior.
- Actual: The warning appears, but the view does not present the pending changes or activate Save automatically.
- Evidence: Owner manual testing in Form Builder on 2026-05-03.
- Priority: high.
- Status: resolved.
- Owner decision: Restore the previous resave workflow so pending propagated field changes are visible and saveable when the affected view is opened.
- Resolution: Hydration now separates the persisted server baseline from the reconciled working document. Drifted non-default views open with pending reconciled changes as dirty/saveable instead of treating reconciliation as saved state.
- Fixed in: `20caa1f`.
- Verification: `pnpm --filter @platform/tenant-web test -- form-builder-workspace-save.test.ts form-builder-workspace-grid.test.ts` passed; full `@platform/tenant-web` test/typecheck/lint passed; `scripts/preflight.sh` passed.

## FB-RT-003 - Preview runtime list suppressed selection and bulk actions

- Area: Form Builder preview runtime list and runtime list metadata.
- URL: `https://demo.platform.localhost/app/platform-studio/forms/users/views/view-accounts`
- Model/View: `users` / `view-accounts`
- Symptom: The preview runtime list shows the `active` column but does not show row-selection checkboxes or `Active` / `No active` / `Delete` bulk actions.
- Expected: Form Builder preview should expose the same selection and bulk actions as the runtime list when the view/table supports them.
- Actual: `LoadRuntimeViewListMeta` built bulk actions in the service, but commit `2552b2d` made `Handler.LoadRuntimeViewListMeta` clear `BulkActions` and set `Selection.Enabled=false` for `/app/platform-studio/forms/.../runtime/*` requests. The same commit also disabled frontend `runBulkAction` when `routeContext === "preview"`.
- Evidence: Owner BE response on 2026-05-03 shows `selection.enabled=false` and `bulkActions=[]` despite `active` being present in `fields` and `columns`. Browser Use smoke: `/app/forms/users/views/view-accounts` shows checkboxes and, after selecting rows, `Active` / `No active` / `Delete`; `/app/platform-studio/forms/users/views/view-accounts` shows no checkboxes.
- Priority: high.
- Status: resolved.
- Owner decision: Preview should keep the previously working selection/bulk-action behavior.
- Fixed in: `e1883fc`.
- Verification: `go test ./modules/tenant/platformstudioformbuilder ./modules/tenant/platformstudioformruntime` passed; `go test ./cmd/api-tenant/internal/server` passed; `pnpm -C platform/frontend --filter @platform/tenant-web typecheck` passed; `pnpm -C platform/frontend --filter @platform/tenant-web lint` passed; `pnpm -C platform/frontend --filter @platform/tenant-web test` passed; `scripts/preflight.sh` passed. Browser verification on the live preview route still needs api-tenant restarted on this code.

## FB-RT-004 - Select and multi-select form options missing

- Area: Runtime form renderer and runtime form option normalization.
- URL: not captured; owner reported from runtime form testing on 2026-05-03.
- Model/View: affected forms with authored `single_select` or `multi_select` fields.
- Symptom: Select and multi-select controls render without the options defined in the Form Builder schema.
- Expected: Runtime select and multi-select controls should render authored schema options.
- Actual: `@platform/forms` runtime schema mapper only read options shaped as objects with `{ value, label }`, while Form Builder authored choice fields can store options as `string[]`. Backend runtime option validation had the same object-only assumption.
- Evidence: Owner manual testing; code inspection of `runtime-form-schema.ts` and `platformstudioformruntime/runtime_context.go`.
- Priority: high.
- Status: resolved.
- Owner decision: Runtime forms must support options authored in the current Form Builder schema shape.
- Fixed in: `0ca2e4b`.
- Verification: `pnpm -C platform/frontend --filter @platform/forms typecheck` passed; `pnpm -C platform/frontend --filter @platform/forms test` passed; `pnpm -C platform/frontend --filter @platform/forms lint` passed; `pnpm -C platform/frontend --filter @platform/tenant-web typecheck` passed; `pnpm -C platform/frontend --filter @platform/tenant-web lint` passed; `pnpm -C platform/frontend --filter @platform/tenant-web test` passed; `go test ./modules/tenant/platformstudioformbuilder ./modules/tenant/platformstudioformruntime` passed; `scripts/preflight.sh` passed. Browser Use could not attach to the in-app browser pane during this pass.

## FB-RT-005 - Choice button option styles need a runtime contract

- Area: Form Builder choice fields and runtime form renderer.
- URL: not captured; owner raised while scoping runtime `single_select` and `multi_select` rendering on 2026-05-03.
- Model/View: affected forms with `Render style = Buttons`.
- Symptom: Form Builder already exposes per-option Button styles for choice fields, but the current runtime slice intentionally only uses `choiceDisplay.renderStyle` and `choiceDisplay.orientation`.
- Expected: Button styles should use a strict semantic per-option contract in Form Builder, normalize through the runtime schema/data contract, and map to approved token-backed button/toggle styles without renderer-side color guessing.
- Actual: Runtime button rendering uses semantic per-option variants when `Render style = Buttons`.
- Evidence: Owner decision on 2026-05-03: implement Native/Button render style and orientation now; do not implement Button styles yet, but record the follow-up.
- Priority: medium.
- Status: resolved.
- Owner decision: Use a strict style select for each option instead of arbitrary color inputs. Accepted variants are `default`, `primary`, `secondary`, `info`, `success`, `warning`, and `danger`; `default` means normal runtime rendering and is not persisted as an option-style entry.
- Resolution: Replaced raw per-option color controls with a semantic style select, normalized Form Builder `choiceDisplay.optionStyles` to `{ option, variant }`, mapped variants into `@platform/forms` runtime options, and applied token-backed runtime button/toggle styling. Raw legacy color-only entries are ignored. Follow-up UI polish removed the visible `Style` label and made each option select full width.
- Fixed in: `39a6aa6`, `39635ab`.
- Verification: `pnpm --filter @platform/forms test -- runtime-form.test.ts` passed; `pnpm --filter @platform/forms typecheck`, `lint`, and `test` passed; `pnpm --filter @platform/tenant-web test -- form-builder-workspace-choice-field.test.ts` passed; full `@platform/tenant-web` typecheck/lint/test passed; `scripts/preflight.sh` passed.

## FB-RT-006 - Managed multi-select values are dropped on save

- Area: Runtime form create/edit save path and Form Builder runtime apply storage metadata.
- URL: not captured; owner reported from runtime form testing on 2026-05-03.
- Model/View: affected managed forms with authored `multi_select` or `tags` fields.
- Symptom: Runtime form `multi_select` selections render and send from the frontend, but are not persisted.
- Expected: Managed `multi_select` and `tags` fields should use the generated per-scope multivalue table, preserving selected option order and values across create/edit/load.
- Actual: Runtime apply created the `__mv` table because fields were marked multivalue, but non-lookup `multi_select`/`tags` were still marked unsupported/deferred. `platformstudioformruntime` then omitted those fields from mutation normalization and scalar writes, so autosave dropped the arrays.
- Evidence: Code inspection of `runtime_apply.go`, `runtime_apply_repository.go`, `runtime_context.go`, `runtime_values.go`, and `repository_write.go`.
- Priority: high.
- Status: resolved.
- Owner decision: Use the existing generated multivalue table for ordinary managed `multi_select` storage.
- Fixed in: `1602473`.
- Verification: `go test ./modules/tenant/platformstudioformbuilder ./modules/tenant/platformstudioformruntime ./cmd/api-tenant/internal/server` passed; `pnpm -C platform/frontend --filter @platform/forms typecheck`, `lint`, and `test` passed; `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test` passed; `git diff --check` passed; `scripts/preflight.sh` passed in lite mode.

## FB-RT-007 - Form Builder choice/grid authoring quality-of-life follow-ups

- Area: Form Builder choice field settings and View tab Grid settings.
- URL: not captured; owner raised while reviewing runtime choice controls on 2026-05-03.
- Model/View: affected authoring views with `single_select`, `multi_select`, and large Grid field lists.
- Symptom: Choice field Orientation needs a better default, and large Grid field lists are hard to sort when inactive/unselected fields are mixed into the same list.
- Expected: `single_select` and `multi_select` Orientation should default to `Horizontal`; Grid settings should have a bool switch above the field list to show only active/list-visible fields, so sorting active columns does not require dragging through dozens of inactive fields.
- Actual: Follow-up not implemented in the current runtime renderer slice.
- Evidence: Owner decision on 2026-05-03.
- Priority: medium.
- Status: resolved.
- Owner decision: Record for a future Form Builder authoring UX slice; do not mix into the current runtime persistence/renderer fix.
- Resolution: New base `single_select` and `multi_select` authoring templates now default Orientation to `Horizontal`. Grid settings now includes a transient `Show visible columns only` switch above the field list so active columns can be reviewed/reordered without dragging through hidden columns; the switch is not persisted and does not drop hidden column metadata.
- Fixed in: `5057028`.
- Verification: `pnpm --filter @platform/tenant-web test -- forms-builder-library.test.ts grid-settings-panel.test.ts` passed; full `@platform/tenant-web` typecheck/lint/test passed; `scripts/preflight.sh` passed.

## FB-RT-008 - Authoring save conflict can appear after a successful view save

- Area: Form Builder authoring save endpoint and save error UX.
- URL: not captured; owner reported while adding a group to `sor` / `view-default` on 2026-05-03.
- Model/View: `sor` / `view-default`.
- Symptom: Adding fields or layout nodes can show a backend `draft version conflict` error even though the view appears saved after reopening.
- Expected: If the save is rejected by expected version conflict, the UI should clearly explain that another/newer draft version exists and should reload/merge/retry according to the intended conflict policy. If the save actually persisted, the backend/UI should not report a conflict as a failed save.
- Actual: Backend logs `FORM_BUILDER_AUTHORING_SAVE` with `error: draft version conflict`, `expectedVersions.model=14`, `expectedVersions.view=19`, while owner observes the view changes are present after reopening. The user-facing error does not make the real state or recovery action clear.
- Evidence: Owner log excerpt on 2026-05-03: `PUT /app/platform-studio/forms/models/sor/views/view-default/authoring` failed with `draft version conflict` after adding a group.
- Priority: high.
- Status: resolved.
- Owner decision: Record for a future Form Builder authoring reliability/UX slice; investigate whether this is stale expected version state, double-save/race behavior, partial save semantics, or misleading error reporting.
- Resolution: Frontend save now uses a single-flight in-flight guard to prevent duplicate concurrent saves from the same workspace instance. Backend model+view draft persistence now uses one atomic `UpdateDraft` transaction with expected version checks before mutation, preventing a stale view conflict from partially updating the model during one save request.
- Fixed in: `20caa1f`.
- Verification: `go test ./modules/tenant/platformstudioformbuilder` passed with atomic conflict regression coverage; `pnpm --filter @platform/tenant-web test -- form-builder-workspace-save.test.ts` passed; full `@platform/tenant-web` typecheck/lint/test passed; `scripts/preflight.sh` passed.

## FB-RT-009 - Canvas tree collapses to root after save

- Area: Form Builder canvas/tree authoring UX.
- URL: not captured; owner reported during Form Builder manual testing on 2026-05-03.
- Model/View: affected Form Builder authoring views.
- Symptom: After saving changes, the canvas tree resets/collapses back to the root level instead of preserving the current expanded/selected level.
- Expected: Save should preserve the authoring context: expanded tree path, selected node, and current canvas position where feasible.
- Actual: After save, the user is returned to root-level tree context, which interrupts editing nested groups/sections.
- Evidence: Owner manual testing on 2026-05-03.
- Priority: medium.
- Status: resolved.
- Owner decision: Record for a future Form Builder authoring UX slice.
- Resolution: Save success now preserves valid transient authoring navigation state in the working document: active scope, current parent, and selected node are retained while saved baselines remain normalized for dirty checks.
- Fixed in: `20caa1f`.
- Verification: `pnpm --filter @platform/tenant-web test -- form-builder-workspace-save.test.ts` passed; full `@platform/tenant-web` typecheck/lint/test passed; `scripts/preflight.sh` passed.

## FB-RT-010 - Subform Grid settings do not persist

- Area: Form Builder subform View tab, Grid settings.
- URL: not captured; owner reported during Form Builder manual testing on 2026-05-03.
- Model/View: affected views with `Subform` scopes.
- Symptom: Each subform has its own View/Grid tab, but Grid settings do not save reliably; the owner cannot choose which fields should be displayed in the subform grid.
- Expected: Subform Grid column selection/order should persist independently for that subform scope and be used by runtime parent-form subtables.
- Actual: Grid changes for a subform scope are not saved or not restored, blocking reliable subform table rendering.
- Evidence: Owner manual testing on 2026-05-03.
- Priority: high.
- Status: resolved.
- Owner decision: Record as a Form Builder blocker before implementing the runtime Subform slice.
- Resolution: Subform Grid columns persist in canonical `subformScopes[].viewSettings.list.columns`; legacy node-level `childGridColumns` is only a non-empty compatibility fallback. Save hydration also reparents compacted subform top-level nodes before normalization so selected columns survive save/reload.
- Fixed in: `3f17fda`, `e2e0c90`.
- Verification: `pnpm --filter @platform/tenant-web test -- form-builder-workspace-grid.test.ts` passed; owner retested and confirmed Subform Grid save behavior works; full `@platform/tenant-web` typecheck/lint/test passed; `scripts/preflight.sh` passed.

## FB-RT-011 - Lookup field settings and View filters need per-lookup review

- Area: Form Builder lookup field settings, lookup presets, View tab Filters, and runtime list filtering.
- URL: not captured; owner added future-work note on 2026-05-03 while pausing the Form Builder stabilization work.
- Model/View: affected fields using `db_lookup` and lookup presets such as Contact, Company, Project, Reported By, and similar lookup-heavy fields.
- Symptom: Lookup-heavy fields need a dedicated review of per-field settings and View filter behavior. Current filter UX/compiler behavior may not expose the right lookup-specific operators, display outputs, or derived values consistently for each lookup field.
- Expected: Each lookup field/preset should have clear authoring settings, predictable display/stored value semantics, and View filters that expose useful lookup-aware filter choices for that specific field.
- Actual: Dedicated per-lookup settings/filter review is not implemented in this stabilization pass.
- Evidence: Owner requested future work on 2026-05-03: review settings for every Lookup field and improve View filters for each lookup field.
- Priority: medium.
- Status: next-slice.
- Owner decision: Record as future Form Builder work; do not close the current Form Builder stabilization thread.
- Fixed in: pending.
- Verification: pending.
