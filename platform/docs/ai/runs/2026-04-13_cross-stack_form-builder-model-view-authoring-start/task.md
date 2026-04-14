---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-13_cross-stack_form-builder-model-view-authoring-start
- title: Form Builder model/view authoring start
- status: closed
- created_at: 2026-04-13 11:03:26 -0400
- updated_at: 2026-04-13 12:09:51 -0400
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
- active_lanes: frontend, backend
- execution_order: control-defined sequence
- scaffolder_action: created via new-run 1.3.0
- run_artifact_scope: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-model-view-authoring-start/

## Goal
- goal: Start Form Builder backend implementation from model/view authoring lifecycle without publish-state coupling.
- why_now: The authoring contract is now stable enough to start backend implementation from add/list/save model and view flows instead of widening the temporary draft/publish slice.
- business_or_technical_value: Create the first real end-to-end Form Builder slice around creating models and views, listing them, saving authoring changes, and respecting locks without introducing premature publish/navigation complexity.

## Scope
- in_scope: backend-first slice for `add model`, `list model`, `model detail with list view`, `add view`, `copy view`, `delete view`, `load/save authoring state`, stable key generation, and persisted `model/view` lock flags; frontend shell updates for Add Model modal, Add View flow, Copy View flow, Delete View action, and workspace navigation into the first created view
- out_of_scope: Navigation Builder publish/access flow; site visibility; model delete; destructive field migration; generated storage DDL; publish status vocabulary; generalized permissions beyond current `root / model / view`; field-level migration tools; broad UI redesign outside the affected Form Builder surfaces

## Locked Invariants
- locked_invariants: Form Builder `Save` is authoring save only; route params `modelId/viewId` carry immutable stable keys; titles are never identifiers; database GUID stays internal only; `status` is not part of the first mandatory product-facing contract; `/draft` naming is temporary technical alias for authoring state; remove from canvas != delete from model; newly added unsaved field may still rename model+view together; after first save canvas rename is view-only; `modelStructureVersion` is integer only; yellow drift warning is driven by `modelStructureVersion > lastAlignedModelStructureVersion`; `root` may lock model and view separately; `isActive` is an explicit authoring flag for a view

## Confirmed Shared Contract
- confirmed_shared_contract: first backend-ready Form Builder contract is locked around model list/detail, view list/detail, one active layout draft tree, coherent authoring save semantics, separate model/view locks, integer structure versioning, and stable key identity; current `/draft` load/save routes are acceptable as temporary authoring-state transport but must not define product lifecycle language

## Facts and Assumptions
- code_confirmed_facts: `tenant-web` Form Builder already uses immutable model/view keys in authoring routes; workspace already supports explicit `isActive` view control, model/view locks, and authoring save semantics; add actions in models/views list are still disabled placeholders; first tenant authoring-state API already exists behind temporary `/draft` route naming; `platform-studio-core` now expresses `guid`, stable `key`, `isActive`, structure versioning, and lock metadata
- doc_confirmed_facts: durable docs now lock Form Builder `Save` as authoring-only and defer site publish/access to Navigation Builder; durable docs now state that stable keys, not titles or GUIDs, are route identity; durable docs now mark model/view `status` as non-mandatory for the first contract
- inferred_facts: frontend can now wire against a concrete backend endpoint set and seeded first-view creation path without another research-only pass; remaining cross-stack work is UI/client integration plus authoring payload alignment, not backend contract discovery
- assumptions: backend confirmed `Create Model` creates the model plus the first default view in one action and returns a selected view for redirect; frontend should now use that path directly and normalize any older draft payload shape only if existing client code still depends on it

## Lane Plan
- lane_plan: mode=CROSS_STACK_SEQUENTIAL; lanes=frontend, backend
- fe_goal: add the missing Form Builder UI actions for model/view creation and view lifecycle around the backend authoring contract, including the Add Model modal and user-friendly transition into the first view workspace
- fe_allowed_scope: `platform/frontend/apps/tenant-web/src/features/platform-studio/**`, supporting runtime config or client wiring already used by Form Builder, and only the minimum shared contract adjustments needed to consume the backend model/view authoring APIs
- fe_likely_files_or_modules: `apps/tenant-web/src/features/platform-studio/forms/pages/forms-index-page.tsx`, `forms-ui-schema-workspace-page.tsx`, `forms-placeholder-data.ts`, `platform-studio-route-meta.ts`, `src/locales/en.ts`, `src/locales/es.ts`, and `packages/api-client` only if existing client methods need widening for model/view authoring
- fe_locked_constraints: do not reintroduce publish-status driven UX; do not treat title as identity; keep Navigation Builder out of scope; preserve current field lifecycle and lock semantics; keep Add Model UX intentionally small and user-friendly
- fe_required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-first-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md`, `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`, `platform/frontend/AGENTS.md`
- fe_required_checks: `pnpm --filter @platform/tenant-web typecheck`; targeted test or smoke coverage if the lane adds client helpers
- fe_expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-model-view-authoring-start/frontend.md
- be_goal: deliver the first backend authoring slice for model/view creation, listing, copy/delete view behavior, authoring-state load/save, stable key generation, and separate lock columns for model/view
- be_allowed_scope: `platform/backend/modules/tenant/platformstudioformbuilder/**`, tenant runtime wiring in `cmd/api-tenant`, tenant migrations, and only the minimum bundle/migration regeneration needed by the new schema and routes
- be_likely_files_or_modules: `modules/tenant/platformstudioformbuilder`, `cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`, `wiring_platform_studio_form_builder.go`, tenant migrations under `migrations/postgres/tenant`, and bundle generation if schema changes land
- be_locked_constraints: backend start must center on authoring lifecycle, not publish lifecycle; do not require model/view status to make the first slice work; stable route identity uses keys, not titles and not GUIDs; prefer dedicated boolean lock columns for model/view rows; keep destructive migration and site publish out of scope
- be_required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-first-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/backend/AGENTS.md`
- be_required_checks: `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`; migration smoke and bundle regeneration if tenant schema changes
- be_expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-model-view-authoring-start/backend.md

## Prompt Delivery
- prompt_delivery_status: ready
- frontend_launch_prompt_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-model-view-authoring-start/frontend.md#ready-chat-launch-prompt
- backend_launch_prompt_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-model-view-authoring-start/backend.md#ready-chat-launch-prompt
- direct_launch_prompt_required: no
- prompt_delivery_notes: backend lane completed and locked the concrete model/view endpoint set, seeded first-view creation behavior, stable-key generation, and dedicated persisted lock columns; frontend lane should consume that packet directly without reopening backend contract questions

## Memory and Risk
- memory_sources_read: `platform/AGENTS.md`, `platform/docs/ai/README.md`, `platform/docs/ai/current-state.md`, `platform/docs/ai/canonical-docs.md`, `platform/docs/ai/decisions-log.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-first-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md`, `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`
- memory_update_targets: current-state.md | decisions-log.md | relevant modules/*.md | canonical-docs.md if authority changed
- approvals_required: none for code changes inside repo; schema decisions must still respect tenant migration discipline
- risks: current temporary `/draft` naming can mislead later work if not documented as technical alias; frontend still needs to align older draft payload handling with the newly concrete model/view endpoints and seeded first-view redirect; shared memory should wait until frontend reconciliation confirms no UI-side contract drift

## Control Progress
- next_control_step: run closed after FE+BE reconciliation, shared-memory updates, and final closeout
- checkpoint_notes: backend lane completed with concrete `models/views` endpoints, `Create Model` seeds the first default view for direct redirect, stable key generation is in place, dedicated `model_locked` / `view_locked` columns landed, backend `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...` passed locally, and frontend consumed the confirmed packet with clean tenant-web/api-client checks

## Final Closeout
- final_status: closed
- shared_memory_updates_applied: current-state.md | decisions-log.md | modules/platform-studio.md
- unresolved_items: cold direct-link header labels can still briefly show stable-key slugs before route data is cached; decide whether backend keeps temporary `/draft` route shape or renames it after the first authoring slice stabilizes
- archive_recommendation: archive after the next follow-up slice or inactivity
