---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-13
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-13_cross-stack_form-builder-three-schema-stabilization
- title: Form Builder three-schema stabilization
- status: active
- created_at: 2026-04-13 20:17:55 -0400
- updated_at: 2026-04-13 20:17:55 -0400
- created_by: Atlas
- skill_name: ramp-conductor
- skill_display_name: Atlas
- skill_version: 1.4.1
- control_prompt_version: 1.4.1
- frontend_prompt_version: 1.1.0
- backend_prompt_version: 1.1.0

## Routing Decision
- run_required: yes
- primary_mode: CROSS_STACK_SEQUENTIAL
- recommended_chat_topology: CONTROL_PLUS_FE_AND_BE
- active_lanes: backend, frontend
- execution_order: backend-first identity/transport hardening, then frontend identity/state refactor, then control reconciliation across core authoring flows
- scaffolder_action: created via new-run 1.3.0
- run_artifact_scope: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/

## Goal
- goal: Stabilize and refactor Form Builder into a production-grade three-schema engine without backend/frontend drift.
- why_now: The initial three-schema rollout landed the model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema` split, but core authoring reliability is still undermined by view identity collapse, default-view heuristics in the frontend, stale test fixtures, and unresolved placement traps that can strand non-default views.
- business_or_technical_value: Make Form Builder the reliable core engine of Platform Studio so create/open/save/copy/delete/reload flows are deterministic, debuggable, and contract-locked across backend and frontend.

## Scope
- in_scope: view identity hardening around `viewId` vs `viewKey`; backend repository/service/test cleanup; frontend authoring state and route identity refactor; default-view detection via explicit contract instead of heuristics; create/open/save/delete/copy stabilization; three-schema reconcile hardening for root/subform/nested placement; debug surfacing of `viewId`, `viewKey`, `dataSchema`, `layoutBlueprint`, and `uiSchema`; decomposition of oversized frontend helpers where required for correctness.
- out_of_scope: publish/runtime data-plane work; Navigation Builder and Action Builder; broad UI redesign unrelated to authoring correctness; destructive migration tooling; reopening blueprint editing for non-default views in this rollout; package promotion outside the minimum needed to remove identity/reconcile drift.

## Locked Invariants
- locked_invariants: `ps_model.definition_json` canonically owns `dataSchema` and `layoutBlueprint`; `ps_view.definition_json` canonically owns `uiSchema`; `viewId` and `viewKey` are distinct concepts and must never silently collapse; route/open/load/save/delete resolve by `viewId`, not `view.key`; `default` may remain a `viewKey` but must not become implicit identity for every view; `Create Model` seeds a valid default view with a real `viewId`; `Create View` seeds a coherent fresh `uiSchema` from current `dataSchema + layoutBlueprint`; `Copy View` clones source `uiSchema` exactly but receives a new `viewId`; explicit scope-root placement is valid authoring, not unresolved fallback; `Unplaced fields` must contain only persisted removed fields or genuinely unresolved reconciled fields; unsaved fields deleted before first save must disappear completely; root placement and subform-root placement must survive save/reload; default-view-only blueprint editing stays enforced in the first stable rollout; non-default views may change only local UI but must still open coherently and fixably.

## Confirmed Shared Contract
- confirmed_shared_contract: `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md` is the primary source of truth; `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md` and `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md` remain the backend transport/payload companions. The current codebase already claims this contract is landed, so this run is a stabilization/refactor pass that must reconcile implementation with the locked contract rather than invent a fourth shape.

## Facts and Assumptions
- code_confirmed_facts: backend transport routes already use `/views/{viewId}` and `/authoring`; frontend api-client also addresses `/views/{viewId}`; backend repository still resolves and mutates views through `(view_id = $2 OR view_key = $2)` in load/update/delete paths; frontend placeholder lookup still treats `guid`, `id`, and `key` as interchangeable identity and workspace/index helpers still match views by `id || key`; frontend drops backend `isDefault` metadata and gates blueprint editing through `view.id === "default" || view.key === "default"` heuristics; route bootstrap fallback currently sets `id` and `key` to the same route param value; backend tests still pass while several fixtures encode legacy `ViewID == "default"` cases that no longer protect the locked identity split; local checks passed for `go test ./modules/tenant/platformstudioformbuilder/...` and tenant-web `tsc --noEmit`, so the current regression exposure is contract-level rather than a red-suite signal.
- doc_confirmed_facts: `viewId` and `viewKey` must stay distinct; `Create View` must seed from canonical model-owned schemas; `Copy View` must preserve source `uiSchema`; unresolved placement must surface only in explicit per-scope `Unplaced fields`; debug must show all three schemas and identity metadata.
- inferred_facts: backend identity hardening is the safest first step because frontend currently relies on permissive matching and missing `isDefault`; the workspace file has accumulated too much mixed identity/reconcile logic for safe stabilization without some extraction; current green tests under-cover the failure matrix the owner cares about.
- assumptions: the fastest safe stabilization path is to harden backend identity semantics first, then align frontend identity/state around explicit `isDefault` and strict `viewId` routing, then run focused cross-stack regression checks across the core flows below.

## Failure Modes
- observed_failure_modes: backend `loadViewTx`, `DeleteView`, and `upsertViewTx` still resolve by `view_id OR view_key`, so open/save/delete can target the wrong row if `view.key` is passed or collides; frontend `matchesFormsPlaceholderIdentity`, `getSelectedViewRouteId`, workspace bootstrap, and current-view selection still accept either `id` or `key`, so route identity can silently degrade back to `view.key`; default-view-only restrictions are enforced through `id/key === "default"` heuristics because `isDefault` is discarded at the placeholder boundary; route bootstrap fallback masks identity drift by synthesizing `id == key == params.viewId`; existing tests still bless legacy `ViewID == "default"` fixtures, so the suite does not currently pin the required `viewId != viewKey` invariant; user-reported fresh non-default view dead-end scenarios and field-to-unplaced escapes remain high-risk because the current code still combines reconcile, identity matching, and view-mode gating in one oversized FE workspace surface.

## Lane Plan
- lane_plan: mode=CROSS_STACK_SEQUENTIAL; lanes=backend, frontend; backend hardens canonical identity and response semantics first, frontend then removes permissive identity heuristics and stabilizes authoring state/reconcile on top of the strict contract.
- fe_goal: refactor tenant-web Form Builder state so view identity is strictly `viewId`, default-view detection comes from explicit backend metadata, route/bootstrap/current-view resolution no longer matches by fallback key heuristics, and three-schema authoring remains coherent for default and non-default views across root/subform/nested placement.
- fe_allowed_scope: `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/**`, `platform/frontend/packages/api-client/**`, and only the minimum locale or route-meta updates needed by the stabilization.
- fe_likely_files_or_modules: `forms-placeholder-data.ts`, `forms-authoring-context.tsx`, `pages/forms-index-page.tsx`, `pages/forms-ui-schema-workspace-page.tsx`, `forms-builder-state.ts`, `forms-builder-contract.ts`, `packages/api-client/src/index.ts`, and extracted helper modules if the workspace page is split.
- fe_locked_constraints: do not reopen publish/navigation scope; do not silently match `view.key` when `viewId` is required; keep non-default views blueprint-read-only in the first stable rollout; do not hide unresolved placement by silently dropping fields into root; preserve exact `Copy View` UI cloning.
- fe_required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/frontend/AGENTS.md`, `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/task.md`
- fe_required_checks: tenant-web `tsc --noEmit`; targeted tests for any `@platform/api-client` transport changes; targeted FE regression assertions around create/open/copy/delete routing and non-default view opening behavior.
- fe_expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/frontend.md
- be_goal: remove backend `viewId/viewKey` ambiguity from repository and service flows, keep create/copy/delete responses keyed by stable `viewId`, and expand tests so the backend enforces the same identity and three-schema invariants that the docs now require.
- be_allowed_scope: `platform/backend/modules/tenant/platformstudioformbuilder/**`, `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`, and only the minimum DTO or handler updates required by strict identity semantics.
- be_likely_files_or_modules: `repository.go`, `service.go`, `model.go`, `handler.go`, `service_test.go`, `authoring_schema.go`, and route wiring only if transport metadata needs tightening.
- be_locked_constraints: do not regress the three-schema persistence split; do not reintroduce `view.key` lookup as a silent compatibility path in canonical flows; keep `Create View` seeded from model-owned schemas and `Copy View` as exact `uiSchema` clone; avoid widening into publish or DDL concerns.
- be_required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/backend/AGENTS.md`, `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/task.md`
- be_required_checks: `go test ./modules/tenant/platformstudioformbuilder/...`; expand/add tests for strict `viewId` resolution, create-model seeded default identity, copy-view fresh identity, and delete safety when `viewId` and `viewKey` diverge.
- be_expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/backend.md

## Bounded Implementation Plan
- bounded_plan: phase 1 backend-first contract hardening around strict `viewId` resolution and test coverage; phase 2 frontend-second identity/state refactor around explicit `isDefault`, strict route identity, and decomposition of mixed workspace helpers; phase 3 cross-stack reconcile and regression pass across create/open/save/copy/delete/placement/removal/debug flows until no core scenario remains knowingly broken.
- backend_first_parts: strict repository lookups and mutations by `view_id`; service tests and fixtures updated so default view has `viewId != viewKey`; response payload continuity for `selectedViewId`, `id`, `key`, and `isDefault`.
- frontend_second_parts: carry `isDefault` through api-client to placeholders; remove `id||key||guid` matching for view route resolution; split route/bootstrap/default-view helpers away from canvas/reconcile logic; tighten current-view selection and navigation around `viewId`; preserve non-default coherent loading without model/blueprint mutation.
- cross_stack_parts: create-model seeded default open, create-view seeded fresh coherent layout, copy-view clone exact UI with new id, root/subform/nested placement round-trip, unsaved-vs-persisted removal semantics, non-default view opening without dead-end, and debug identity/schema visibility.
- refactor_required: backend repository identity helpers must be consolidated around one canonical path; frontend placeholder identity layer and workspace route/bootstrap/default-view logic need extraction because current mixed heuristics are part of the bug surface.
- refactor_optional: deeper inspector/palette component extraction after stabilization; any package-boundary cleanup beyond the files directly required for reliability.

## Regression Matrix
- regression_matrix: create model -> model row plus default view row with real `viewId`, `viewKey=default`, direct open by `viewId`; create view -> new non-default `viewId`, coherent blueprint-derived layout, no trapped unplaced-only state; copy view -> new `viewId`, exact `uiSchema` clone, open by new `viewId`; open/load/save/delete -> strict `viewId` transport and persistence, no `view.key` fallthrough; placement -> ROOT, SUBFORM ROOT, and nested containers all place/save/reload correctly; removal -> unsaved field disappears fully, persisted field returns to `Unplaced fields`; non-default views -> model/blueprint editing disabled but layout remains coherent and actionable; debug -> clearly exposes `viewId`, `viewKey`, `dataSchema`, `layoutBlueprint`, `uiSchema`; regression hygiene -> backend and frontend tests explicitly cover divergent `viewId` vs `viewKey` fixtures.

## Prompt Delivery
- prompt_delivery_status: ready
- frontend_launch_prompt_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/frontend.md#ready-chat-launch-prompt
- backend_launch_prompt_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/backend.md#ready-chat-launch-prompt
- direct_launch_prompt_required: no
- prompt_delivery_notes: backend lane completed with no contract drift and now hardens canonical backend view operations to strict `viewId` semantics; frontend prompt is the active next prompt and should be executed against that hardened contract.

## Memory and Risk
- memory_sources_read: `AGENTS.md`, `docs/README.md`, `docs/codex-native-repo.md`, `platform/AGENTS.md`, `platform/backend/AGENTS.md`, `platform/frontend/AGENTS.md`, `platform/backend/docs/README.md`, `platform/frontend/docs/README.md`, `platform/docs/ai/README.md`, `platform/docs/ai/current-state.md`, `platform/docs/ai/canonical-docs.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, and the two prior 2026-04-13 Form Builder runs for continuation triage only.
- memory_update_targets: current-state.md | decisions-log.md | modules/platform-studio.md | canonical-docs.md if authority changed
- approvals_required: none for in-repo code/doc work
- risks: green tests currently understate contract drift; the oversized frontend workspace page increases risk of partial fixes unless identity and reconcile helpers are split; backend strictness may expose latent frontend key-based navigation assumptions immediately; this run must not be closed while any core authoring scenario above is still known-broken.

## Control Progress
- next_control_step: execute the frontend lane against the hardened backend contract, then run the regression matrix and either issue a correction packet or continue until the core authoring flows are reliable.
- checkpoint_notes: backend lane completed with no contract drift; repository `open/load/update/delete` view resolution is now strict on `viewId`, compatibility `screens` metadata now carries explicit `isDefault`, and test fixtures now pin distinct default-view `viewId` vs `viewKey`; prior runs `2026-04-13_cross-stack_form-builder-model-view-authoring-start` and `2026-04-13_cross-stack_form-builder-three-schema-rollout-start` remain historical context only.

## Final Closeout
- final_status: draft
- shared_memory_updates_applied: not yet
- unresolved_items: none yet; stabilization findings are recorded above and must be burned down during the lane execution
- archive_recommendation: archive only after closeout and inactivity
