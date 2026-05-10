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
- Actual: Dedicated per-lookup settings/filter review is only partially implemented. Generic lookup active filtering, preset lookup authoring controls, and the shared dictionary option query contract exist, but Form render/runtime enforcement and View filter compiler improvements remain future work.
- Evidence: Owner requested future work on 2026-05-03: review settings for every Lookup field and improve View filters for each lookup field.
- Priority: medium.
- Status: partial.
- Owner decision: Record as future Form Builder work; do not close the current Form Builder stabilization thread.
- Resolution: First Form Builder authoring pass added preset display-template selects and explicit preset filters for `Contact` / `Contacts`, `Company` / `Companies`, and `Project` / `Projects`. Preset filters now use shared tenant dictionary routes and UI Kit Combobox multiselects for `jobtypes`, `companies`, and `companyTypes` instead of raw ID text inputs. Named dictionaries use `GET /app/dictionaries/{dictionaryKey}/options`; generic ordinary lookup option sources can use `POST /app/dictionaries/options/query` with `sourceModel`, selected fields, filters, search, ids, and paging. Combobox filter pickers debounce remote search by 300 ms, load the first 10 options, and load additional pages on scroll. DB LOOKUP filter authoring is complete for the current Form Builder scope. Active-record filtering remains a runtime/default concern, not a preset Form Builder setting.
- Fixed in: `c3bd9bf` and `8d68cb6`.
- Verification: targeted backend dictionary tests, targeted preset lookup settings Vitest, tenant-web `tsc --noEmit`, targeted ESLint, and Browser Use verification passed.

## FB-RT-012 - Subform View tab lost title editing

- Area: Form Builder Subform scope, View tab, Subtable details.
- URL: not captured; owner requested restore on 2026-05-03.
- Model/View: affected views with `Subform` scopes.
- Symptom: When working inside a Subform scope, the View tab only shows Subtable metadata/actions/sorting and no longer gives the user a way to change the Subform title/name.
- Expected: The Subform View tab should allow editing the user-facing Subform title. The editable value is the parent `Subform` node `title`; storage identity such as `schemaScopeId`, `tableKey`, runtime table names, and route identity must not be renamed from this field.
- Actual: The Subform View tab did not render a title input.
- Evidence: Owner request on 2026-05-03.
- Priority: medium.
- Status: resolved.
- Owner decision: Restore title editing for Subform View; treat it as display title, not storage/identity name.
- Resolution: Added a Subform title input to the non-root View tab, wired it to update the active Subform parent node `title`, kept subform identity fields unchanged, and documented the title/identity boundary.
- Fixed in: current change set.
- Verification: `pnpm --filter @platform/tenant-web test -- form-builder-workspace-grid.test.ts` passed; `pnpm --filter @platform/tenant-web typecheck` passed; `pnpm --filter @platform/tenant-web lint` passed; `git diff --check` passed; `scripts/preflight.sh` passed.

## FB-RT-013 - Plain short text and email/phone fields need a Unique value authoring flag

- Area: Form Builder field schema and selected field settings.
- URL: not captured; owner requested on 2026-05-03.
- Model/View: affected forms with plain `short_text` fields, ready-made `Email`/`Phone` fields, or `short_text` fields validated as email/phone.
- Symptom: Text input fields expose `Autocomplete`, but there is no adjacent authoring parameter for marking values that must be unique, such as email or phone.
- Expected: Form Builder should expose a `Unique value` switch for plain `short_text`, ready-made `Email`, ready-made `Phone`, and `short_text` fields with `validation = email | phone`. Specialized text presets such as `URL` and `suggest_text` should not expose this switch. The persisted schema parameter should be compact and explicit.
- Actual: No authoring schema flag or field settings UI existed.
- Evidence: Owner request on 2026-05-03.
- Priority: medium.
- Status: resolved.
- Owner decision: Use `uniqueValue` as the schema parameter name and `Unique value` as the user-facing label. Form Builder owns authoring/schema only; runtime enforcement belongs in `platformstudioformruntime`.
- Resolution: Added `uniqueValue?: boolean` to Form Builder field authoring state and platform-studio-core field schema, rendered a `Unique value` switch directly under `Autocomplete` for plain `short_text` and email/phone text fields, preserved supported `true` values through clone/authoring summary/canonical data schema/backend normalization, and omitted disabled/false or unsupported values from compact payloads. Owner retest found the switch missing on plain `short_text`; the support rule was corrected to include only plain `short_text` plus email/phone, while excluding URL and suggest text presets.
- Runtime resolution: `platformstudioformruntime` now enforces supported `uniqueValue` fields on root create/edit and DEFAULT subform create/edit. Root checks are tenant/root-scope scoped; subform checks are scoped to the current parent record. Create checks exclude the current `clientCreateToken` GUID to preserve idempotent retry behavior. Tenant-web now maps server mutation validation errors from autosave into inline errors and explicit action dialogs.
- Fixed in: current change set.
- Verification: `pnpm --filter @platform/tenant-web test -- form-builder-workspace-unique-value.test.ts` passed; `pnpm --filter @platform/tenant-web typecheck` passed; `pnpm --filter @platform/tenant-web lint` passed; `pnpm --filter @platform/platform-studio-core typecheck` passed; `pnpm --filter @platform/platform-studio-core lint` passed; `go test ./modules/tenant/platformstudioformbuilder` passed; runtime follow-up checks passed with `go test ./modules/tenant/platformstudioformruntime`, `go test ./cmd/api-tenant/internal/server ./modules/tenant/platformstudioformruntime`, `go test ./modules/tenant/platformstudioformbuilder ./modules/tenant/platformstudioformruntime ./cmd/api-tenant/internal/server`, `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`, `lint`, and `test`; `git diff --check` passed; `scripts/preflight.sh` passed.

## FB-RT-014 - Subform child changes no longer mark the parent Subform in the tree

- Area: Form Builder canvas dirty/attention markers across scoped Subform trees.
- URL: not captured; owner reported on 2026-05-03 after testing Slice 6.
- Model/View: affected forms with `Subform` scopes and changed fields inside a Subform.
- Symptom: When a field inside a Subform is changed, that child field is marked yellow, but the parent Subform in the root tree is not marked.
- Expected: Dirty/attention highlighting should show the full path to the changed node so the user can see where the change happened from the root tree. A changed field inside a Subform should mark the field, its in-scope ancestors, the parent Subform node, and any root-scope ancestors.
- Actual: Attention propagation walked only `parentId` links inside a single flattened node map. Nodes inside `subformScopes[].uiSchema.nodes` can have `parentId = null`, so the walk stopped before reaching `subformScopes[].parentSubformNodeId`.
- Evidence: Owner report on 2026-05-03.
- Priority: medium.
- Status: resolved.
- Owner decision: Restore the previous tree-level visibility of changed Subform descendants.
- Resolution: Indexed document nodes by scope and extended attention propagation to cross from Subform-scope nodes through `parentSubformNodeId`, then continue walking root-scope ancestors.
- Fixed in: current change set.
- Verification: `pnpm test -- form-builder-workspace-diff-helpers.test.ts` passed from `platform/frontend/apps/tenant-web`; broader checks are recorded in the active work artifact.

## FB-RT-015 - Other View warning triangle appears after field setting changes

- Area: Form Builder View list drift indicator and model structure versioning.
- URL: not captured; owner reported on 2026-05-04.
- Model/View: affected models with multiple views when editing field settings in the Default View.
- Symptom: Changing a field parameter can show the yellow warning triangle on other views.
- Expected: The warning triangle should show only real cross-view structure divergence. Adding/removing fields, moving fields between root/subform scopes, and adding/removing/retargeting subform scopes should affect other views. Field parameter changes such as `placeholder`, `autocomplete`, `validation`, `uniqueValue`, option styles, lookup settings, and layout-only blueprint edits should not.
- Actual: `modelStructureVersion` advanced from a broad `dataSchema`/`layoutBlueprint` diff. Most field settings remained in the structural signature, so unrelated parameter changes looked like model drift.
- Evidence: Owner report on 2026-05-04 and code analysis of `forms-index-views-panel.tsx`, `form-builder-draft-save.ts`, frontend structure signatures, and backend `structureChanged`.
- Priority: medium.
- Status: resolved.
- Owner decision: Treat the View-list triangle as a true model-topology drift indicator, not a generic field-settings dirty marker.
- Resolution: Replaced broad structure comparison with a topology-only signature on frontend and backend. The signature includes field IDs by root/subform scope, subform scope ids/table keys, and subform type. It ignores field settings and default-view `layoutBlueprint`-only changes.
- Fixed in: current change set.
- Verification: `pnpm test -- form-builder-workspace-diff-helpers.test.ts` passed; full tenant-web Vitest/typecheck/lint passed; `go test ./modules/tenant/platformstudioformbuilder` passed; `git diff --check` passed; `scripts/preflight.sh` passed.

## FB-RT-016 - Form Builder exposes View Active/Inactive controls

- Area: Form Builder Views panel and View inspector tab.
- URL: not captured; owner requested on 2026-05-06.
- Model/View: affected Form Builder models with authored views.
- Symptom: The Views panel shows an Active/Inactive eye status, and the View tab exposes a `Mark as active view` toggle.
- Expected: Form Builder should not present or control runtime/sidebar visibility. Navigation Builder owns sidebar placement and runtime exposure for `form_builder_view` targets.
- Actual: Form Builder UI exposed view active state, creating confusion between form authoring and navigation/sidebar publication.
- Evidence: Owner request on 2026-05-06.
- Priority: medium.
- Status: resolved.
- Owner decision: Remove Form Builder UI for View Active/Inactive and retire `isActive` from Form Builder view config. Keep backend `ps_view.is_active` / API summary values only as deprecated compatibility metadata for now.
- Resolution: Removed the Active/Inactive eye icon from the Views panel, removed the View Active switch from the View tab, removed the active-view update handler from Form Builder controls, removed `isActive` from frontend view config/schema/fallback routing, stopped writing `isActive` to new `ps_view.definition_json` payloads, and documented that Navigation Builder owns sidebar/runtime exposure.
- Fixed in: current change set.
- Verification: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `git diff --check`, and `scripts/preflight.sh` passed.
