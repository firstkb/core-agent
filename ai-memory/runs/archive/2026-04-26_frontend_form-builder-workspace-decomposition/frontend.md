---
template_id: lane-report
template_version: 1.3.1
status: closed
owner: ramp-platform-v108
last_updated: 2026-04-26
---

# LANE FILE

Use this template for run-backed FE/BE lanes.
Do not create a lane file for direct no-run work.
Owner-requested `MANUAL_HANDOFF_NO_RUN` uses a chat prompt and compact Agent
Evidence, not this persistent lane artifact.

## Metadata
- task_id: 2026-04-26_frontend_form-builder-workspace-decomposition
- lane: frontend
- status: closed
- report_time: 2026-04-26 22:07:23 -0400
- prompt_version: 1.2.1
- control_prompt_version: 1.5.2
- author: Atlas

## Launch Metadata
- base_prompt_file: ai-memory/atlas/prompts/frontend-prompt-v1.md
- base_prompt_version: 1.2.1
- prompt_variant: full
- launch_prompt_status: ready

## Ready Chat Launch Prompt
```text
Use base prompt: ai-memory/atlas/prompts/frontend-prompt-v1.md

Task id: 2026-04-26_frontend_form-builder-workspace-decomposition
Lane: frontend
Route: FE_ONLY run-backed
Run folder: ai-memory/runs/archive/2026-04-26_frontend_form-builder-workspace-decomposition/

Restate:
Implement the first safe page-layer decomposition slice for the tenant-web Platform Studio Form Builder workspace. Preserve behavior. Do not rewrite the state architecture.

Required reads:
1. AGENTS.md
2. platform/AGENTS.md
3. ai-memory/START_HERE.md
4. ai-memory/index/read-routes.yaml
5. ai-memory/durable/current-state.md
6. ai-memory/modules/domains/platform-studio/README.md
7. ai-memory/modules/domains/platform-studio/contract.md
8. ai-memory/modules/frontend/tenant-web/README.md
9. ai-memory/modules/frontend/platform-studio-ui/README.md
10. platform/frontend/AGENTS.md
11. platform/frontend/docs/modules/platform-studio/form-builder.md
12. platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx
13. platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts

Allowed scope:
- Frontend-only tenant-web Form Builder.
- Edit the workspace page and add focused app-local components under platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/.
- Prefer presentational extraction from the page.
- Initial page slices kept `forms-builder-state.ts` read-only; later state-layer slices split selectors/actions with compatibility re-exports.

Out of scope:
- Backend, API, storage, Form Builder contract, auth, tenancy, grants, route guard, and UX redesign changes.
- State model rewrite.
- Cross-package abstraction.
- Navigation Builder, Action Builder, PDF Builder, Report Builder behavior.
- Vendor/reference-code reads.

Exact file ownership plan:
- pages/forms-ui-schema-workspace-page.tsx remains the workspace controller/orchestrator and owns state, handlers, load/save, route guard, and dialogs; schema compile helpers now live in focused controller helper files.
- components/builder-canvas.tsx owns canvas panel, breadcrumb, empty canvas, and unplaced-field presentation; page passes display data and callbacks.
- components/builder-canvas-node-row.tsx owns a single canvas row and row-level drag/visibility/open controls.
- components/field-palette.tsx owns palette search/list rendering and palette-item presentation; it receives display-ready sections and callbacks.
- components/grid-settings-panel.tsx owns grid settings panel and grid-column row presentation; page passes display data and callbacks.
- components/view-settings-panel.tsx owns the view settings tab shell; focused child components own root details/locks/workflow/actions/sorting/system fields/default filters.
- components/empty-state.tsx owns loading-card presentation only.
- components/error-state.tsx owns missing/error-card presentation and action slot only.
- `forms-builder-state.ts` state-layer changes are limited to behavior-preserving selector/action extraction with compatibility exports.

Risk controls:
- Keep callback behavior in the page.
- Do not alter model/view identity, save/load, locks, dirty state, runtime routes, or schema ownership behavior.
- Keep the diff small enough to review.

Required checks:
- From platform/frontend: pnpm --filter @platform/tenant-web typecheck
- From repo root: scripts/ai/preflight.sh if practical

Return/update:
- Update this frontend.md Lane Return Report with touched files, summary, checks, blockers, risks, contract drift, proposed memory deltas, and next step.
- Atlas owns final shared-memory updates.
```

## Control Packet Snapshot
- assigned_goal: Extract small behavior-preserving page-layer components from the tenant-web Form Builder workspace.
- why_now: `forms-ui-schema-workspace-page.tsx` and `forms-builder-state.ts` are large monoliths; this first slice reduces page-layer risk without changing state architecture.
- allowed_scope:
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
  - New app-local component files under `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/`
- likely_files_or_modules:
  - `pages/forms-ui-schema-workspace-page.tsx`
  - `components/builder-canvas.tsx`
  - `components/builder-canvas-node-row.tsx`
  - `components/field-palette.tsx`
  - `components/grid-settings-panel.tsx`
  - `components/view-settings-panel.tsx`
  - `components/view-settings-root-sections.tsx`
  - `components/view-settings-actions-sorting-section.tsx`
  - `components/view-settings-system-fields-section.tsx`
  - `components/view-settings-default-filters-section.tsx`
  - `components/empty-state.tsx`
  - `components/error-state.tsx`
- locked_constraints:
  - Behavior-preserving extraction only.
  - No state architecture rewrite.
  - No backend/API/storage/auth/tenancy/grants/route guard changes.
  - No cross-package abstraction.
  - Do not touch other Platform Studio builders.
- out_of_scope:
  - Navigation Builder, Action Builder, PDF Builder, Report Builder behavior.
  - Vendor/reference-code reads.
  - Durable shared-memory updates unless a boundary decision is made.
- required_reads:
  - `AGENTS.md`
  - `platform/AGENTS.md`
  - `ai-memory/START_HERE.md`
  - `ai-memory/index/read-routes.yaml`
  - `ai-memory/durable/current-state.md`
  - `ai-memory/modules/domains/platform-studio/README.md`
  - `ai-memory/modules/domains/platform-studio/contract.md`
  - `ai-memory/modules/frontend/tenant-web/README.md`
  - `ai-memory/modules/frontend/platform-studio-ui/README.md`
  - `platform/frontend/AGENTS.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts`
- required_checks:
  - `pnpm --filter @platform/tenant-web typecheck` from `platform/frontend`
  - `scripts/ai/preflight.sh` from repo root if practical
- expected_report_path: ai-memory/runs/archive/2026-04-26_frontend_form-builder-workspace-decomposition/frontend.md
- memory_delta_expectation: propose shared-memory deltas only; Atlas finalizes

## Analysis Snapshot
- locked_invariants:
  - Form Builder remains app-local tenant-web UI.
  - Model/view identity, three-schema authoring ownership, draft load/save, locks, dirty-state, and runtime apply semantics stay unchanged.
  - `forms-builder-state.ts` remains the compatibility export owner while focused state helpers take over selectors/actions.
- confirmed_facts:
  - Workspace page is approximately 8.8k lines and contains both controller logic and presentational palette/loading/missing markup.
  - Builder state is approximately 3.8k lines and exports palette/document helpers used by the page.
- assumptions:
  - The first safe cut should move static/presentational rendering only, with page callbacks preserving behavior.
- change_classification: app-local frontend refactor; behavior-preserving; no shared contract change.

## Lane Return Report
- touched_files:
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-draft-api.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-draft-save.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-debug-dialog.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-draft-hydration.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-draft-save-action.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-leave-guard.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-lookup-source-models.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-lookup-source-picker.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-rule-filter-editors.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-route-workspace.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-transient-ui-effects.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-workspace-controller.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-canvas-actions.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-choice-field.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-delete-node.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-display-items.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-palette-items.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-lookup-options.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-lookup-source-picker.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-lookup-derived-outputs.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-view-only-bindings.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-view-metadata.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-storage-keys.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-system-field-derivation.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-system-fields.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-field-scope-grid.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-rule-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-selected-field-settings-handlers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-selected-node-updates.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-filter-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-schema-utils.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-schema-compact.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-data-schema.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-layout-compile.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-ui-schema.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-document-hydration.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-debug-schemas.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-diff-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-document-updates.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-display-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-normalization-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-actions.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-document-normalization.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-default-document.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-document-storage.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-flat-workspace.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-node-actions.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-scoped-document.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-scope-ui.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-selectors.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-palette-selectors.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/builder-canvas.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/builder-canvas-node-row.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/field-palette.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/grid-settings-panel.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-panel.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-root-sections.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-actions-sorting-section.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-system-fields-section.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-default-filters-section.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/inspector-panel.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-inspector-basic-section.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-field-settings.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-option-row.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-button-styles-section.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-field-settings.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/text-field-settings.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/date-today-field-settings.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/tags-field-settings.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-delete-action.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-inspector-empty-state.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-topline.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-source-picker-dialog.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/debug-dialog.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/delete-node-confirmation-dialog.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/unsaved-leave-confirmation-dialog.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/default-filter-editor-dialog.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/quick-filter-editor-dialog.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/filter-condition-editor.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-filter-editor.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/filter-condition-editor-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-filter-editor-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rules-panel.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rule-editor-dialog.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rule-condition-editor.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rule-condition-editor-helpers.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/grid-inspector-tab-body.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selected-field-settings-section.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selected-node-rules-delete-section.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-inspector-tab-body.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-inspector-tab-body.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/empty-state.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/error-state.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-dialog-stack.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-dialog-types.ts`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-filter-dialogs.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-inspector.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-rule-dialogs.tsx`
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-support-dialogs.tsx`
- summary_of_changes:
  - Goal checkpoint: the Form Builder decomposition is still on target, but the next priority is page route-shell reduction rather than further state action micro-slices.
  - Extracted draft save payload/response orchestration into `form-builder-draft-save.ts`; page now delegates draft payload construction, save request/retry, missing-endpoint fallback, and saved response normalization.
  - Added `form-builder-draft-api.ts` for shared draft endpoint helper/types used by load and save helpers.
  - Extracted draft load/hydration orchestration into `useFormBuilderDraftHydration`; the hook now owns draft load request, unauthorized retry, missing-draft handling, draft load error state, hydration signature, and draft normalization/reconciliation.
  - Kept hydrated draft application in the page: `replaceModel`, model/layout draft setters, and `hydrateDocument` remain page-owned for this slice.
  - Extracted lookup source model loading/cache orchestration into `useFormBuilderLookupSourceModels`; the hook owns source model cache, available source model derivation, selected lookup source prefetch, and draft-backed load/retry/fallback/sign-out handling.
  - Extracted lookup source picker UI state into `useFormBuilderLookupSourcePicker`; the hook owns open/close state, selected model/fields/sort state, picker loading/error reaction, and default selected-field/sort normalization.
  - Kept lookup config mutation/save in the page: `saveLookupSourcePicker` still applies the selected source model/display fields through the existing `updateSelectedField` flow.
  - Extracted lookup source picker save/apply derivation into `form-builder-workspace-lookup-source-picker.ts`; the helper now builds the selected lookup field update from picker state and source model.
  - Kept lookup source picker mutation and dialog close wiring in the page: `saveLookupSourcePicker` still guards the save, calls `updateSelectedField`, and closes the picker after the update path.
  - Extracted field option update/rename/reorder and choice option style derivation into `form-builder-workspace-choice-field.ts`; page keeps selected-field mutation callbacks.
  - Extracted grid-column visibility and reorder derivation into `form-builder-workspace-field-scope-grid.ts`; page keeps `updateCurrentGridColumns` and current-scope view settings callbacks.
  - Extracted System Field semantic-role binding, document binding, workflow-status option updates, and create-field binding derivation into `form-builder-workspace-system-field-derivation.ts`.
  - Kept System Field mutation ownership in the page: `updateSystemFieldBinding`, `updateWorkflowStatusOption`, and `handleCreateSystemField` still call `updateCurrentModel`, `updateFieldById`, and `updateDocument`.
  - Extracted default filter, quick filter, root view settings, current subform view settings, selected-node rules document update derivation, root/subform view action toggles, corrective-action toggle, sorting updates, and grid-column list update wrapping into `form-builder-workspace-document-updates.ts`.
  - Kept filter/view mutation ownership in the page: default/quick filter save/delete callbacks, `updateDocument`, `updateViewSettings`, and current-scope update callbacks remain page-owned.
  - Extracted unsaved-leave/navigation guard orchestration into `useFormBuilderLeaveGuard`; the hook owns leave confirmation open state, pending navigation path/resolver refs, browser `beforeunload`, and Platform Studio global leave guard registration.
  - Kept unsaved-leave dialog presentation in the page by passing hook-provided open/confirm/cancel/open-change callbacks into `UnsavedLeaveConfirmationDialog`.
  - Extracted save action orchestration into `useFormBuilderDraftSaveAction`; the hook owns access-token guard, save request invocation, save error handling, unauthorized sign-out handling, and saving-state transitions.
  - Kept saved-draft commit in the page: `hydrateDocument`, model/layout draft setters, `replaceModel`, save pulse, and local authoring state application remain page-owned.
  - Extracted debug dialog open state and debug schema string derivation into `useFormBuilderDebugDialog`; page now keeps only `DebugDialog` presentation wiring.
  - Extracted transient workspace UI effects into `useFormBuilderTransientUiEffects`; the hook owns selected-node editor reset, choice drag reset, selection inspector auto-scroll, invalid view-tab fallback, and default-filter field fallback.
  - Kept explicit user-action handlers in the page: rule/filter cancel/save/delete actions, lookup picker close/save, and choice drag/drop callbacks remain page-owned.
  - Extracted rule/default/quick filter editor UI state into `useFormBuilderRuleFilterEditors`; the hook owns visibility/requirement rule draft state, default filter draft state, quick filter draft state, open/change/close handlers, and quick filter draft shaping.
  - Kept actual document mutations in the page: rule save/delete, default filter save/delete, and quick filter save still update the Form Builder document through the existing page-owned handlers.
  - Extracted route workspace resolution and bootstrap loading/error state into `useFormBuilderRouteWorkspace`; page now receives resolved model/view state from a focused controller hook.
  - Extracted palette search/list/palette item markup into `FieldPalette`.
  - Extracted canvas panel, breadcrumb, node-row, empty canvas, and unplaced-field presentation into `BuilderCanvas` and `BuilderCanvasNodeRow`.
  - Extracted canvas interaction callbacks into named page handlers and moved canvas node visibility-cycle document update derivation into `form-builder-workspace-canvas-actions.ts`; page still owns drag state and `updateDocument`.
  - Extracted choice option and grid column drag/drop callbacks into named page handlers; page still owns drag state and selected-field/grid mutation callbacks.
  - Extracted RulesPanel delete callbacks and selection delete-open wiring into named page handlers; page still owns rule mutation helpers and delete dialog state.
  - Extracted selected-field settings inline mutation callbacks into named page handlers: view-only binding, choice option add/remove, lookup display mode, text placeholder/mask/validation/autocomplete, date-today display/readonly, and tags max/mode.
  - Extracted selected-field settings handler implementations into `form-builder-workspace-selected-field-settings-handlers.ts`; page now dependency-injects `updateSelectedField`, `updateDocument`, selected-node context, and label strings, then passes returned handlers into the existing components.
  - Extracted selected-field settings JSX into `SelectedFieldSettingsSection`; page now passes selected-field flags, summaries, and handlers into the focused component.
  - Extracted selected-node rules/delete composition into `SelectedNodeRulesDeleteSection`; page still owns rule editor handlers, rule delete callbacks, and delete dialog state.
  - Extracted the selection inspector tab body into `SelectionInspectorTabBody`; page still owns selected-node derivation, selection scroll ref, editor state, and mutation handlers.
  - Extracted grid and view inspector tab bodies into `GridInspectorTabBody` and `ViewInspectorTabBody`; page still owns grid/view derivation, drag state, and mutation handlers.
  - Extracted workspace inspector tab composition into `WorkspaceInspector`; page still owns tab body data derivation and mutation handlers.
  - Extracted the workspace dialog stack into `WorkspaceDialogStack`; page still owns dialog state plus save/delete/confirm handlers and passes them into the component.
  - Split `WorkspaceDialogStack` into focused rule, filter, support, and tiny shared-types units; the stack is now only a thin dialog-group orchestrator.
  - Extracted grid settings panel and grid-column row presentation into `GridSettingsPanel`.
  - Extracted the view settings tab into `ViewSettingsPanel` and focused section components.
  - Extracted the selection/grid/view tab card and scroll shell into `InspectorPanel`/`InspectorPanelTab`; page still owns `inspectorTab`, refs, tab body JSX, and all mutation callbacks.
  - Extracted selection inspector header, persisted-field row, basic node title/visibility/required controls, and basic non-field node controls into `SelectionInspectorBasicSection`; specialized field-kind settings remain in the page as children for later slices.
  - Extracted choice field settings into `ChoiceFieldSettings`, `ChoiceOptionRow`, and `ChoiceButtonStylesSection`; page still owns option mutation/reorder and choice display/style update handlers.
  - Extracted lookup field settings into `LookupFieldSettings`; page still owns source picker state/dialog, lookup helper summaries, and lookup mutation handlers.
  - Extracted short text preset field settings into `TextFieldSettings`; page still owns `updateSelectedField` and autocomplete default calculation.
  - Extracted date-today field settings into `DateTodayFieldSettings`; page still owns display format and readonly mutation callbacks.
  - Extracted tags field settings into `TagsFieldSettings`; page still owns tag mode and max tag mutation callbacks.
  - Extracted selection inspector delete danger-zone action and empty state into focused components; page still owns delete dialog state and delete handler.
  - Extracted workspace topline actions and badge row into `WorkspaceTopline`; page still owns navigation/debug/save handlers and save state.
  - Extracted lookup source picker dialog presentation into `LookupSourcePickerDialog`; picker UI state/loading/error now live in a focused hook, while page still owns source summary preparation and lookup save handlers.
  - Extracted debug dialog presentation into `DebugDialog`; debug open state and schema strings now live in `useFormBuilderDebugDialog`.
  - Extracted delete-node confirmation dialog presentation into `DeleteNodeConfirmationDialog`; page still owns delete dialog state and delete handler.
  - Extracted delete-node confirmation action derivation into `form-builder-workspace-delete-node.ts`; page still owns close calls, `deleteUnsavedField`, `updateDocument`, and `removeFormBuilderNode` invocation.
  - Extracted root view metadata/model-lock mutation derivation into `form-builder-workspace-view-metadata.ts`; page still owns `updateDocument`, `updateCurrentModel`, and `updateCurrentViewMetadata` callbacks.
  - Extracted selected-node basic inspector mutation derivation into `form-builder-workspace-selected-node-updates.ts`; page still owns `updateDocument`, `updateFieldById`, and `updateFormBuilderNode` callback ownership.
  - Extracted unsaved-leave confirmation dialog presentation into `UnsavedLeaveConfirmationDialog`; guard state/resolver now live in `useFormBuilderLeaveGuard`.
  - Extracted default filter editor dialog chrome into `DefaultFilterEditorDialog`; page still owns filter draft state, condition editor, and save/delete handlers.
  - Extracted quick filter editor dialog chrome into `QuickFilterEditorDialog`; page still owns quick filter draft state, condition editors, and save handlers.
  - Extracted scalar/default filter condition editing into `FilterConditionEditor`; page still owns default/quick filter draft state and save/delete handlers.
  - Extracted lookup filter clause editing into `LookupFilterEditor`; lookup/scalar editor helpers were split into focused app-local helper files.
  - Deduplicated filter helper source-of-truth by removing page-local copies of scalar filter defaults/formatting and lookup clause definitions; page now imports those app-local helpers while retaining filter draft state and save/delete handlers.
  - Extracted selected-node rules list/menu presentation into `RulesPanel`.
  - Extracted shared visibility/requirement rule dialog chrome into `RuleEditorDialog`; page still owns draft state, condition editor, and save/delete handlers.
  - Extracted rule condition field/operator/value editing into `RuleConditionEditor`; page still owns visibility/requirement draft state and save/delete handlers.
  - Extracted rule operator defaults, scalar formatting/parsing, and rule condition change helpers into `rule-condition-editor-helpers.ts`.
  - Removed unused page-local `EditableStringList`; no Form Builder call sites existed, so extracting it would have preserved dead code rather than reducing active surface.
  - Extracted core workspace data derivation into `useFormBuilderWorkspaceController`; page still owns save/load, route guards, mutation handlers, and display item shaping.
  - Extracted display item builders for canvas, grid, rules, default filters, lookup source picker, and view sorting/filter options into `form-builder-workspace-display-items.ts`.
  - Extracted palette display section construction and system field palette item types into `form-builder-workspace-palette-items.ts`; page still owns the create-element/create-field/create-system-field handlers passed into the helper.
  - Extracted lookup source/model option construction, draft parsing, source model lookup, field label lookup, and lookup summary helpers into `form-builder-workspace-lookup-options.ts`; page still owns lookup picker state, loading/validation, and save handlers.
  - Extracted lookup derived output definitions, derived pseudo-fields, and binding option rows into `form-builder-workspace-lookup-derived-outputs.ts`.
  - Extracted view-only binding option derivation and title-autofill update payload derivation into `form-builder-workspace-view-only-bindings.ts`; page still owns selected option lookup and the mutation callback that applies the selected binding.
  - Extracted shared app-local `toStorageKey` into `form-builder-workspace-storage-keys.ts` to avoid duplicating storage-key normalization between the page and lookup derived output helpers.
  - Extracted System Field key/template/compatibility-option helpers plus System Field palette and view-settings row builders into `form-builder-workspace-system-fields.ts`; pure System Field mutation derivation now lives in `form-builder-workspace-system-field-derivation.ts`, and page still owns create/bind mutation callbacks.
  - Extracted field lookup/label helpers, scope field derivation, grid column sorting/order helpers, and grid-column mutation derivation into `form-builder-workspace-field-scope-grid.ts`; page still owns field and grid mutation callbacks.
  - Extracted rule cloning/defaults/summaries/single-condition normalization, rule save upsert derivation, rule delete derivation, and runtime preset compatibility helpers into `form-builder-workspace-rule-helpers.ts`; page still owns visibility/requirement rule mutation callbacks.
  - Extracted filter condition summaries, lookup clause summaries, quick filter summaries, filter token labels, quick-filter color normalization, default/quick filter save upsert derivation, and default-filter remove derivation into `form-builder-workspace-filter-helpers.ts`; page still owns default/quick filter draft state and save/delete handlers.
  - Extracted canonical data/UI/layout schema compile, schema compaction, schema scope helpers, document hydration from canonical schemas, debug/runtime schema compilation, and diff/attention helpers into focused controller helper files; page still owns save/load, route guards, dirty-state, and mutation handlers.
  - Extracted display labels, palette descriptions, node summary text, field title sync, choice option style sync, persisted-field checks, and visibility cycling into focused controller helper files; page still owns handlers and mutation flow.
  - Moved read-only document/navigation selectors into `state/form-builder-selectors.ts`; `forms-builder-state.ts` imports and re-exports them so existing call sites keep the same import path and behavior.
  - Moved read-only palette/access/display selectors into `state/form-builder-palette-selectors.ts`; `forms-builder-state.ts` imports/re-exports them so existing call sites and internal state helpers keep the same behavior.
  - Moved the first selection/navigation action group into `state/form-builder-actions.ts` via injected document internals: `updateFormBuilderNode`, `setFormBuilderCurrentParent`, and `selectFormBuilderNode`; `forms-builder-state.ts` keeps the original compatibility exports.
  - Moved add-element/add-field actions into `state/form-builder-actions.ts` using the same injected-internals pattern: `addFormBuilderElementNode` and `addFormBuilderFieldNode`; reconcile append helpers, remove/reorder, normalization, and save flow remain in `forms-builder-state.ts`.
  - Moved remove/move/reorder node actions into focused `state/form-builder-node-actions.ts`; `state/form-builder-actions.ts` composes that action group and `forms-builder-state.ts` keeps compatibility exports.
  - Moved scoped document normalization/finalization into `state/form-builder-scoped-document.ts`; low-level scope UI selected/current-parent/unplaced-field helpers now live in `state/form-builder-scope-ui.ts`.
  - Moved persistence/document storage read-write helpers into `state/form-builder-document-storage.ts`; `forms-builder-state.ts` keeps compatibility wrappers for `readFormBuilderDocument`, `saveFormBuilderDocument`, `createPersistedFormBuilderDocument`, and `useFormBuilderDocument`.
  - Moved flat-workspace reconstruction into `state/form-builder-flat-workspace.ts`; node-map, subform-scope localization, scoped UI node shaping, and `buildScopedDocumentFromFlatWorkspace` now live in a focused helper with injected normalization internals.
  - Moved default document factory/seed helpers into `state/form-builder-default-document.ts`; `forms-builder-state.ts` keeps the `createDefaultFormBuilderDocument` export and imports schema-scope seed helpers for reconciliation.
  - Moved persisted document normalization into `state/form-builder-document-normalization.ts`; `forms-builder-state.ts` keeps public wrappers for `normalizeFormBuilderDocument` and `normalizePersistedFormBuilderDocument`.
  - Moved runtime scope, system-field, filter definition, node-rule, and grid/view normalization clusters into focused state helper files; `forms-builder-state.ts` imports them and keeps compatibility exports for public runtime normalizers.
  - Moved layout-blueprint parsing, field/subform append helpers, and model reconciliation orchestration into focused state helper files; `forms-builder-state.ts` now keeps only compatibility export wiring for `reconcileFormBuilderDocumentWithModel`.
  - Moved exported Form Builder domain/state types into `state/form-builder-types.ts` and `state/form-builder-filter-rule-types.ts`; `forms-builder-state.ts` re-exports them for compatibility.
  - Moved rule/filter save/delete handlers, view/grid settings handlers, and canvas interaction handlers into focused controller helpers while preserving page-owned state injection.
  - Added a durable Platform Studio UI memory lesson: future builder UI work should start with app-local focused components and controller/helper units instead of growing workspace pages.
  - Extracted workspace loading card into `WorkspaceLoadingState`.
  - Extracted workspace missing/error card into `WorkspaceErrorState`.
  - Kept Form Builder UI mutation callbacks, navigation, save button state wiring, and hydrated/saved authoring state application in the workspace page.
  - Page file is now 1,580 lines; `forms-builder-state.ts` is now 392 lines. New page-shell handler helpers are focused: rule/filter handlers 210 lines, view/grid handlers 188 lines, and canvas handlers 96 lines.
- checks_run:
  - `pnpm --filter @platform/tenant-web typecheck` from `platform/frontend` passed; command emitted existing Node engine warning (`current v18.17.0`, expected `>=22.12.0`).
  - `scripts/ai/preflight.sh` passed.
  - `git diff --check` passed.
- checks_still_needed: none
- blockers: none
- unresolved_risks:
  - No functional browser smoke was run; behavior preservation is validated by typecheck and review of callback-only extraction.
- contract_drift: no
- proposed_memory_deltas: applied `ai-memory/modules/frontend/platform-studio-ui/README.md` lesson for future builder UI decomposition.
- next_lane_step: Do a final Form Builder closeout review and commit checkpoint. If no regressions or obvious boundary leaks are found, stop Form Builder refactoring for now and move to the next global monolith target instead of continuing micro-slices.

## Reconciliation Readiness
- ready_for_reconciliation: yes
- ready_for_closeout: yes
- recommended_next_control_action: Archive this updated run record; continue with pure normalization cluster extraction when requested.
