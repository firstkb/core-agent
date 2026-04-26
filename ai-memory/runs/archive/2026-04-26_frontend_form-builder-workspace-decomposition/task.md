---
template_id: control-task
template_version: 1.3.0
status: closed
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-26_frontend_form-builder-workspace-decomposition
- title: Form Builder workspace decomposition slice
- status: closed
- created_at: 2026-04-26 12:07:10 -0400
- updated_at: 2026-04-26 15:50:52 -0400
- created_by: Atlas
- skill_name: ramp-conductor
- skill_display_name: Atlas
- skill_version: 1.5.2
- control_prompt_version: 1.5.2
- frontend_prompt_version: 1.2.1
- backend_prompt_version: 1.2.0

## Routing Decision
- run_required: yes
- primary_mode: FE_ONLY
- recommended_chat_topology: CONTROL_PLUS_FE
- active_lanes: frontend
- execution_order: single lane
- scaffolder_action: created via new-run 1.4.0
- run_artifact_scope: ai-memory/runs/archive/2026-04-26_frontend_form-builder-workspace-decomposition/

## Goal
- goal: Extract small behavior-preserving page-layer units from tenant-web Form Builder workspace.
- why_now: Workspace page/state monoliths are high-risk for agent work; this slice reduces page-layer risk without changing state architecture.
- business_or_technical_value: Make the first reviewable cut in the Form Builder workspace page so future agents can work against focused app-local components instead of one 8.8k-line page.

## Scope
- in_scope:
  - Frontend-only tenant-web Form Builder workspace.
  - Behavior-preserving extraction from `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`.
  - New app-local component files under `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/`.
  - Page-level cleanup only; keep existing state functions, handlers, and persistence behavior intact.
- out_of_scope:
  - Backend/API/storage/Form Builder contract changes.
  - Auth, tenancy, grants, route guards, Navigation Builder, Action Builder, PDF Builder, Report Builder, or runtime ACL changes.
  - State model rewrite or cross-package abstraction.
  - Vendor/reference-code reads.

## Locked Invariants
- locked_invariants:
  - Existing behavior must be preserved.
  - Form Builder remains the active Platform Studio tool; planned tools stay out of this slice.
  - Platform Studio UI stays app-local in `tenant-web`; do not promote shared packages.
  - Model/view identity, three-schema ownership, authoring save/runtime apply behavior, locks, and route params must not change.
  - `forms-builder-state.ts` is read-only in this slice unless a tiny type/export is strictly required.

## Confirmed Shared Contract
- confirmed_shared_contract:
  - `tenant-web` owns app-local Platform Studio React UI.
  - `@platform/platform-studio-core` is UI-free shared contract/helper space, not a UI component package.
  - Form Builder owns model/view authoring, field/layout authoring, rules, grid/view settings, and authoring save.
  - Navigation/sidebar exposure, grants, events, PDFs, and reports belong to other Platform Studio tools.

## Facts and Assumptions
- code_confirmed_facts:
  - `forms-ui-schema-workspace-page.tsx` is approximately 8.8k lines.
  - `forms-builder-state.ts` is approximately 3.8k lines and exports the palette/document/state helpers consumed by the page.
  - Existing page-local presentational markup includes loading/missing cards and the palette search/list panel.
- doc_confirmed_facts:
  - Active Form Builder behavior is tracked in `platform/frontend/docs/modules/platform-studio/form-builder.md`.
  - Platform Studio UI and Form Builder workspace are app-local tenant-web concerns.
- inferred_facts:
  - The safest first slice is extracting low-coupling presentational components with callback props, not moving controller or state architecture.
- assumptions:
  - Review value is highest if the first diff is small and avoids semantic changes to handlers and persistence paths.

## Lane Plan
- lane_plan: mode=FE_ONLY; lanes=frontend; executed inline in the current chat after run packet creation.
- fe_goal: Extract small page-layer components from the tenant-web Form Builder workspace while preserving behavior.
- fe_allowed_scope:
  - Edit `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`.
  - Add focused app-local components under `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/`.
  - Keep `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts` unchanged unless typecheck proves a tiny export is needed.
- fe_likely_files_or_modules:
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`: remains workspace controller/orchestrator and owns state/handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/builder-canvas.tsx`: owns canvas panel, breadcrumb, empty canvas, and unplaced-field presentation; page passes display data and callbacks.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/builder-canvas-node-row.tsx`: owns a single canvas row and row-level drag/visibility/open controls.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/field-palette.tsx`: owns palette search/list/palette item presentation; page passes display sections and callbacks.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/grid-settings-panel.tsx`: owns grid settings panel and grid-column row presentation; page passes display data and callbacks.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-panel.tsx`: owns the view settings tab shell.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-root-sections.tsx`: owns root view details, authoring locks, and workflow sections.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-actions-sorting-section.tsx`: owns actions and sorting sections.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-system-fields-section.tsx`: owns system field binding section.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-default-filters-section.tsx`: owns default filters section.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/inspector-panel.tsx`: owns selection/grid/view tab card and scroll shell only.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-inspector-basic-section.tsx`: owns selection inspector header, persisted-field row, basic node controls, and basic non-field node controls; page passes mutation callbacks and specialized field-kind settings as children.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-field-settings.tsx`: owns choice field options/display/selection settings presentation and delegates mutation callbacks to the page.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-option-row.tsx`: owns a single choice option row and option menu presentation.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-button-styles-section.tsx`: owns choice button style color controls.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-field-settings.tsx`: owns lookup field source summary and display mode presentation; page keeps source picker state/dialog and lookup mutation handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/text-field-settings.tsx`: owns short text placeholder/mask/validation/autocomplete presentation; page keeps `updateSelectedField` and autocomplete default calculation.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/date-today-field-settings.tsx`: owns date-today default-value, display-format, and readonly presentation; page keeps mutation callbacks.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/tags-field-settings.tsx`: owns tags mode/max-tags presentation; page keeps tag mode and max tag mutation callbacks.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-delete-action.tsx`: owns selection inspector delete danger-zone button presentation; page keeps delete dialog state and delete handler.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-inspector-empty-state.tsx`: owns selection inspector empty-state presentation.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/workspace-topline.tsx`: owns workspace topline actions and badge row presentation; page keeps navigation/debug/save handlers and save state.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-source-picker-dialog.tsx`: owns lookup source picker dialog presentation; page keeps picker state, validation/loading state, source summary preparation, and lookup save handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/debug-dialog.tsx`: owns debug dialog presentation; page keeps compiled schema strings and debug open state.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/delete-node-confirmation-dialog.tsx`: owns delete-node confirmation dialog presentation; page keeps delete dialog state and delete handler.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/unsaved-leave-confirmation-dialog.tsx`: owns unsaved-leave confirmation dialog presentation; page keeps leave confirmation state and resolver.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/default-filter-editor-dialog.tsx`: owns default filter editor dialog chrome; page keeps filter draft state, condition editor, and save/delete handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/quick-filter-editor-dialog.tsx`: owns quick filter editor dialog chrome; page keeps quick filter draft state, condition editors, and save handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/filter-condition-editor.tsx`: owns scalar/default filter condition editor presentation and local condition-change shaping; page keeps filter draft state and save/delete handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-filter-editor.tsx`: owns lookup filter clause editor presentation and local clause-change shaping.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/filter-condition-editor-helpers.ts`: owns scalar filter editor helper defaults and formatting used by extracted filter editor components.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-filter-editor-helpers.ts`: owns lookup filter editor clause definitions and lookup clause defaults used by extracted lookup editor components.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rules-panel.tsx`: owns selected-node rules list/menu presentation.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rule-editor-dialog.tsx`: owns shared visibility/requirement rule dialog chrome; page keeps editor state and handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rule-condition-editor.tsx`: owns rule condition field/operator/value editor presentation and local condition-change shaping; page keeps visibility/requirement draft state and save/delete handlers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/rule-condition-editor-helpers.ts`: owns rule operator defaults, scalar formatting/parsing, and rule condition default/change helpers.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/empty-state.tsx`: owns loading card presentation.
  - `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/error-state.tsx`: owns missing/error card presentation and action slot.
- fe_locked_constraints:
  - Do not rewrite state architecture.
  - Do not change saved draft, load, save, lock, route, model/view, or runtime contract behavior.
  - Do not create cross-package abstractions.
  - Do not touch other Platform Studio builders.
- fe_required_reads:
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
- fe_required_checks:
  - `pnpm --filter @platform/tenant-web typecheck` from `platform/frontend`
  - `scripts/ai/preflight.sh` from repo root if practical
- fe_expected_report_path: ai-memory/runs/archive/2026-04-26_frontend_form-builder-workspace-decomposition/frontend.md
- be_goal:
- be_allowed_scope:
- be_likely_files_or_modules:
- be_locked_constraints:
- be_required_reads:
- be_required_checks:
- be_expected_report_path:

## Prompt Delivery
- prompt_delivery_status: ready
- frontend_launch_prompt_path: ai-memory/runs/archive/2026-04-26_frontend_form-builder-workspace-decomposition/frontend.md#ready-chat-launch-prompt
- backend_launch_prompt_path:
- direct_launch_prompt_required: no
- prompt_delivery_notes: FE prompt is recorded for run-backed handoff, but Atlas is executing the FE lane inline in the current chat for this requested first slice.

## Memory and Risk
- memory_sources_read:
  - Required repo/platform/memory/frontend/Form Builder files listed in `fe_required_reads`.
  - `ai-memory/README.md`, `ai-memory/index/memory-index.yaml`, `ai-memory/durable/module-index.md`, `platform/frontend/docs/README.md`, and Atlas templates/prompts needed for run scaffolding.
- memory_update_targets: none expected unless implementation creates a durable boundary decision.
- approvals_required:
- risks:
  - Import path/type-only mistakes from new component files.
  - Accidentally moving behavior into presentational components; mitigate by passing display-ready data and event callbacks from the page.
  - Hidden coupling in page-local helper functions; keep helpers in page for this slice.

## Control Progress
- next_control_step: Close out and archive this slice; continue next by extracting `EditableStringList` into a focused component.
- checkpoint_notes:
  - Compact decomposition plan locked before implementation.
  - First FE lane slice completed inline by Atlas/main chat.
  - Typecheck, preflight, and diff whitespace checks passed.
  - Owner clarified that the previous output was not the full desired decomposition; run reopened for a larger page/workspace extraction slice.
  - Continued with `view-settings-panel.tsx` and split large view settings areas into focused section components.
  - Continued with `rules-panel.tsx` and `rule-editor-dialog.tsx`; page still owns rule draft state, condition editor, save/delete handlers, and `forms-builder-state.ts` remains unchanged.
  - Continued with `inspector-panel.tsx`; page still owns `inspectorTab`, refs, tab body JSX, and all mutation callbacks.
  - Continued with `selection-inspector-basic-section.tsx`; page still owns mutation handlers and the remaining specialized field-kind settings.
  - Continued with choice field settings components; page still owns option mutation/reorder and choice display/style update handlers.
  - Continued with `lookup-field-settings.tsx`; page still owns source picker state/dialog, lookup helper summaries, and lookup mutation handlers.
  - Continued with `text-field-settings.tsx`; page still owns `updateSelectedField` and autocomplete default calculation.
  - Continued with `date-today-field-settings.tsx`; page still owns display format and readonly mutation callbacks.
  - Continued with `tags-field-settings.tsx`; page still owns tag mode and max tag mutation callbacks.
  - Continued with `selection-delete-action.tsx` and `selection-inspector-empty-state.tsx`; page still owns delete dialog state and delete handler.
  - Continued with `workspace-topline.tsx`; page still owns navigation/debug/save handlers and save state.
  - Continued with `lookup-source-picker-dialog.tsx`; page still owns picker state, validation/loading state, source summary preparation, and lookup save handlers.
  - Continued with `debug-dialog.tsx`; page still owns compiled schema strings and debug open state.
  - Continued with `delete-node-confirmation-dialog.tsx`; page still owns delete dialog state and delete handler.
  - Continued with `unsaved-leave-confirmation-dialog.tsx`; page still owns leave confirmation state and resolver.
  - Continued with `default-filter-editor-dialog.tsx`; page still owns filter draft state, condition editor, and save/delete handlers.
  - Continued with `quick-filter-editor-dialog.tsx`; page still owns quick filter draft state, condition editors, and save handlers.
  - Continued with `filter-condition-editor.tsx` and `lookup-filter-editor.tsx`; page still owns default/quick filter draft state and save/delete handlers.
  - Split scalar and lookup filter editor helpers into focused app-local helper files to keep visual component units under 300 lines.
  - Deduplicated filter helper source-of-truth by importing scalar filter defaults/formatting and lookup clause definitions from the extracted helper modules into the page.
  - Continued with `rule-condition-editor.tsx` and `rule-condition-editor-helpers.ts`; page still owns visibility/requirement draft state and save/delete handlers.

## Final Closeout
- final_status: closed
- shared_memory_updates_applied: no durable docs/memory updates; run artifacts only
- unresolved_items: no browser smoke run
- archive_recommendation: archive now
