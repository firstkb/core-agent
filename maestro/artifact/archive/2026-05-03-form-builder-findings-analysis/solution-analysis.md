# Form Builder Findings Solution Analysis

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Source findings: `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/source-findings.md`
- Original source path: `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- Date: 2026-05-03

## Executive Recommendation

Start with the Form Builder grid/scope correctness slice:

1. `FB-RT-010` - Subform Grid settings do not persist.
2. `FB-RT-001` - Sorting field pickers should use active Grid output fields.

These two issues share the same product boundary: view-owned grid output per scope. They block reliable runtime subform tables and can create runtime query mismatches. They are lower risk than concurrency changes because they can be fixed with scoped frontend normalization plus backend runtime-list hardening.

Then handle the save/hydration reliability slice:

1. `FB-RT-002` - Drifted views no longer preload pending propagated field changes as dirty/saveable.
2. `FB-RT-008` - Save conflict can appear after a successful save.
3. `FB-RT-009` - Canvas context collapses to root after save.

These all touch draft hydration/save baseline behavior and should be tested together so one fix does not mask another.

## Classification

| Finding | Status In Source | Recommended State | Implementation Priority |
|---|---:|---|---:|
| `FB-RT-001` sorting pickers include non-grid fields | triage | implement in first grid slice | high |
| `FB-RT-002` drifted view resave no longer preloads changes | triage | implement in save/hydration slice | high |
| `FB-RT-003` preview selection/bulk actions suppressed | resolved | no code work; check contract docs for drift | none |
| `FB-RT-004` select/multi-select options missing | resolved | no work | none |
| `FB-RT-005` choice button option styles need runtime contract | next-slice | contract-first design slice | medium |
| `FB-RT-006` managed multi-select values dropped on save | resolved | no work | none |
| `FB-RT-007` choice/grid authoring QoL follow-ups | next-slice | authoring UX slice after blockers | medium |
| `FB-RT-008` save conflict after apparent successful save | triage | implement in save/hydration slice | high |
| `FB-RT-009` canvas tree collapses after save | triage | implement in save/hydration slice | medium |
| `FB-RT-010` subform grid settings do not persist | triage | implement first; blocker for runtime Subform | high |

## Finding Details

### FB-RT-010 - Subform Grid Settings Do Not Persist

Observed likely root cause:

- `buildCanonicalUiSchema` correctly writes subform `viewSettings` under each `uiSchema.subformScopes[]`.
- `buildWorkspaceDocumentFromCanonicalSchemas` reads subform `viewSettings` back into the scoped document.
- During normalization, subform nodes get `childGridColumns` from `normalizeGridColumns(node.childGridColumns, fieldIds)`. When the raw node has no legacy `childGridColumns`, that returns `[]`, not `undefined`.
- `buildScopedDocumentFromFlatWorkspace` then prefers `subformNode.childGridColumns ?? existingScope.viewSettings.list.columns`, so an empty legacy fallback overwrites real subform `viewSettings.list.columns`.

Proposed solution:

1. Make subform scope `viewSettings.list.columns` the canonical source.
2. Treat `subformNode.childGridColumns` as a legacy fallback only when the raw property is explicitly present and non-empty.
3. Update `normalizeFormBuilderDocument` and scoped rebuild helpers so an absent legacy property cannot overwrite persisted subform view settings.
4. Keep `buildCanonicalUiSchema` writing subform `viewSettings`; do not move this state back onto the subform node.
5. Add frontend tests for save/load of subform grid columns and order.
6. Add or confirm backend test coverage that subform runtime grid views use persisted subform columns.

Evidence expectations:

- A subform Grid tab change survives save, reload, and route revisit.
- Runtime parent-form subtables consume the saved subform grid projection.

### FB-RT-001 - Sorting Field Pickers Should Use Grid Output Fields

Observed likely root cause:

- `use-form-builder-workspace-derived-state.ts` builds `currentScopeSortingFields` from all fields in the current scope.
- `createViewSettingsSortingFields` maps those fields directly into the sorting picker.
- The picker therefore ignores `viewSettings.list.columns[].visible`.
- Backend `buildRuntimeViewListDefaultSort` resolves a sort field from the schema field set, but does not require the resolved alias to be part of the active grid projection.

Proposed solution:

1. Define sorting options as the current scope's visible grid output fields, not all schema fields.
2. Use the same output model as Grid settings, including lookup-derived pseudo fields when they are visible output columns.
3. When a selected sort field is removed from visible Grid output, clear sorting to unbound instead of preserving a hidden invalid value.
4. Harden backend default sort resolution by accepting only aliases present in the active grid plan projections. If not present, return no default sort.
5. Add frontend tests for root and subform sorting option filtering.
6. Add backend runtime-list tests for non-visible selected sort fields.

Evidence expectations:

- Root View Sorting shows only visible root Grid output fields.
- Subtable sorting shows only visible fields for that subform scope.
- Runtime query does not order by a column absent from the grid view.

### FB-RT-002 - Drifted View Resave No Longer Preloads Pending Changes

Observed likely root cause:

- Hydration detects drift with `modelStructureVersion > lastAlignedModelStructureVersion` and reconciles the view with canonical field placements.
- The page then calls `hydrateDocument(baselineDocument)`.
- `useFormBuilderDocument.hydrateDocument` sets both `document` and `savedDocument` to the same reconciled value, so Save is disabled and pending changes are not visibly dirty.

Proposed solution:

1. Separate server-persisted baseline from reconciled working document.
2. For drifted non-default views, set the working document to the reconciled document but keep the saved baseline as the pre-reconciliation server document.
3. Preserve attention highlighting for newly inserted or changed nodes.
4. Enable Save when drift reconciliation changed the working document.
5. After Save succeeds, update `lastAlignedModelStructureVersion` and reset the baseline to the saved response.

Evidence expectations:

- After Default View structure changes, affected views open with pending changes visible.
- Save is enabled immediately.
- After saving, the warning clears and Save is disabled.

### FB-RT-008 - Save Conflict Can Appear After Successful View Save

Observed likely root cause candidates:

- Frontend expected versions are computed from `savedModelDraft` and the previous saved view state.
- The backend updates model and view through separate repository transactions. If one succeeds and the other conflicts, the save is not atomic.
- A fast double-save or stale in-flight request can make the first request persist and the second request report `FORM_BUILDER_CONFLICT`, which matches the owner's observation that reopening shows changes.
- The frontend currently surfaces the generic backend message instead of a recovery action.

Proposed solution:

1. Add a frontend in-flight save guard with a ref, not only React state, so duplicate clicks cannot issue concurrent saves.
2. Return structured conflict data from the backend: current model/view versions and whether persisted state differs from the submitted state.
3. Make model+view authoring save atomic in one transaction where possible, or avoid updating the model when the view expected version is already stale.
4. In the frontend, handle `FORM_BUILDER_CONFLICT` with explicit UX: reload latest draft, compare/reapply local changes when feasible, or tell the user the save already landed if the server payload matches.
5. Add backend tests for view conflict after model update and frontend tests for duplicate save.

Evidence expectations:

- Double-click Save produces one request or one accepted result, not a visible false conflict.
- A real stale conflict explains the recovery action.
- Partial model/view persistence cannot occur from a single save request.

### FB-RT-009 - Canvas Tree Collapses To Root After Save

Observed likely root cause:

- Persistence helpers intentionally reset `activeScopeId`, `currentParentId`, and `selectedNodeId` for stored baseline state.
- After save, the page calls `hydrateDocument(savedDocument)`, replacing the active in-memory editing context with the reset saved document.

Proposed solution:

1. Treat canvas navigation state as transient UI state, not saved authoring schema.
2. On save success, merge the current valid `activeScopeId`, `currentParentId`, and `selectedNodeId` into the returned saved document before setting the working document.
3. Keep the saved baseline reset/normalized for dirty checks, but do not force the user back to root in the working document.
4. Add a helper such as `preserveWorkspaceNavigation(nextDocument, previousDocument)`.
5. Validate node ids still exist before preserving selection or current parent.

Evidence expectations:

- Saving inside a nested group/subform keeps the same canvas level and selection.
- Dirty detection still resets correctly after save.

### FB-RT-007 - Choice/Grid Authoring Quality-of-Life Follow-Ups

Observed likely root cause:

- `forms-builder-library.ts` defaults `single_select` and `multi_select` orientation to `vertical`.
- `GridSettingsPanel` renders one list of all fields and has no transient filter to show only visible/list-active columns.

Proposed solution:

1. Change default `choiceDisplay.orientation` for `single_select` and `multi_select` authoring templates to `horizontal`.
2. Confirm whether ready-made `radio_group` and `checkbox_group` should also default to horizontal; do not guess if product taste matters.
3. Add a Grid tab switch above the field list: "Show visible columns only".
4. Keep the switch as transient UI state unless the owner explicitly wants it persisted as a preference.
5. When the filter is active, drag reorder should operate on the visible subset without deleting hidden column metadata.

Evidence expectations:

- New choice fields default to horizontal orientation.
- Large Grid lists can be filtered to active columns for easier sorting.

### FB-RT-005 - Choice Button Option Styles Need Runtime Contract

Observed current state:

- Form Builder authoring supports raw per-option colors in `choiceDisplay.optionStyles`.
- Runtime form schema currently maps `renderStyle` and `orientation`, not per-option styles.
- Runtime field types do not define an option-style contract.

Proposed solution:

1. Define the runtime contract before rendering: option identity, allowed style properties, and fallback behavior.
2. Prefer semantic UI Kit variants or approved tokens over arbitrary renderer-side guessing.
3. If raw hex colors remain accepted, sanitize them at the schema boundary and preserve accessible text/background contrast rules.
4. Add runtime types for option styles, map Form Builder `choiceDisplay.optionStyles`, and apply them in button-style single/multi-select fields.
5. Add visual/browser evidence because this is UI-visible and contrast-sensitive.

Evidence expectations:

- Authored button styles appear in runtime forms.
- Native render style remains unaffected.
- Invalid or missing styles fall back safely.

### Resolved Findings And Contract Drift

`FB-RT-003`, `FB-RT-004`, and `FB-RT-006` are marked resolved in the source findings and should not be reopened by this analysis.

One doc drift risk remains: `platform/backend/docs/contracts/platform-studio-form-builder.md` still says preview runtime metadata suppresses bulk actions, while source findings and current tests indicate preview metadata keeps bulk actions. The next implementation or docs cleanup slice should align the backend contract with the accepted owner decision and current route behavior.

## Recommended Implementation Slices

### Slice 1 - Grid And Sorting Correctness

Scope:

- Fix `FB-RT-010`.
- Fix `FB-RT-001`.
- Add focused frontend tests for subform grid persistence and sorting options.
- Add backend hardening/tests for default sort only using active grid projections.

Do not touch:

- Runtime grants.
- Navigation Builder ACL.
- Action Builder.
- Destructive runtime schema migration.

### Slice 2 - Draft Hydration And Save Reliability

Scope:

- Fix `FB-RT-002`.
- Fix `FB-RT-008`.
- Fix `FB-RT-009`.
- Add backend save atomicity/conflict tests.
- Add frontend tests for drifted view dirty state, duplicate save prevention, and canvas context preservation.

Do not touch:

- Form runtime persistence semantics already resolved by `FB-RT-006`.
- Runtime apply destructive behavior.

### Slice 3 - Authoring UX Follow-Ups

Scope:

- Fix `FB-RT-007`.
- Keep the Grid visible-only switch transient unless the owner approves persisted preference behavior.

### Slice 4 - Choice Button Style Runtime Contract

Scope:

- Design and implement `FB-RT-005`.
- Update Form Builder and runtime form contracts/types together.
- Run browser visual evidence for button style rendering and accessibility basics.

## Memory And Docs Impact

No durable memory update is needed for this analysis alone because it records temporary planning and proposed implementation slices. If Slice 1 or Slice 2 is implemented, update the relevant Form Builder planned-work memory and canonical frontend/backend docs only for accepted behavior changes or contract drift cleanup.
