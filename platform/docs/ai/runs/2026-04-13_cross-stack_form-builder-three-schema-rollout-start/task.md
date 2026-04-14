---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-13
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-13_cross-stack_form-builder-three-schema-rollout-start
- title: Form Builder three-schema rollout start
- status: completed
- created_at: 2026-04-13 14:25:00 -0400
- updated_at: 2026-04-13 17:53:35 -0400
- created_by: Codex
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
- execution_order: control-defined sequence
- scaffolder_action: manual packet prepared by Codex
- run_artifact_scope: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/

## Goal
- goal: Implement the next stable Form Builder architecture around model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`.
- why_now: The current authoring slice now proves that scope awareness alone is not enough; new views still lose multi-level structure because model-owned layout topology does not exist yet.
- business_or_technical_value: Make Form Builder view creation, reconcile, and reload behavior predictable and durable across model fields, subforms, sections, tabs, accordions, grids, and other structural containers without silently degrading into root-level placement.

## Scope
- in_scope: backend/frontend implementation of the three-schema contract; `ps_model.definition_json` support for `dataSchema` and `layoutBlueprint`; `ps_view.definition_json` support for `uiSchema`; `Create View` seeding from model schemas; `Copy View` exact UI clone; reconcile on open across all three schemas; explicit `Unplaced fields`; debug modal output for three schemas; lazy compatibility migration from current stored drafts
- out_of_scope: publish/runtime rendering finalization; Navigation Builder; Action Builder; destructive migration workflow; generated DDL changes beyond metadata contract support; broad design rewrite; content-node blueprint generalization beyond the structural container set locked in the contract

## Locked Invariants
- locked_invariants: Form Builder `Save` is authoring save only; route params `modelId/viewId` carry immutable stable keys; titles are never identifiers; database GUID stays internal only; canonical transport naming stays `/authoring`; `Add View` is not the same as `Copy View`; `Copy View` must remain an exact `uiSchema` clone; unresolved field placement must never silently fall back to raw `root`; `default` view is the first stable editor for model-owned blueprint structure; `Accordion` and `Accordion item` belong to the accepted layout blueprint container set together with `Tabs` and `Tab item`

## Confirmed Shared Contract
- confirmed_shared_contract: `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md` is now the source of truth for the next rollout; `ps_model.definition_json` owns `dataSchema` and `layoutBlueprint`, `ps_view.definition_json` owns `uiSchema`, `Add View` seeds from model schemas, `Copy View` clones exact UI, and debug output must expose all three schemas explicitly

## Facts and Assumptions
- code_confirmed_facts: backend now persists model-owned `dataSchema + layoutBlueprint` in `ps_model` and view-owned `uiSchema` in `ps_view`; canonical `/authoring` load/save now use the explicit three-schema split with lazy compatibility mirrors for older drafts; frontend now loads and saves the explicit three-schema payload, treats backend-issued `containerKey` values as canonical during reconcile, and exposes `Data Schema`, `Layout Blueprint`, and `UI Schema` in the debug modal
- doc_confirmed_facts: three-schema split is now documented in `form-builder-three-schema-contract.md`; accepted blueprint container set includes `section`, `group`, `grid`, `column`, `tabs`, `tab_item`, `accordion`, `accordion_item`, and `subform`; unresolved placement must surface as `Unplaced fields`
- inferred_facts: default-view-only blueprint editing remains the cleanest first-stable enforcement point; broader shared frontend policy enforcement may still be deferred until more builder entry points exist
- assumptions: the blocked `pnpm --filter @platform/tenant-web typecheck` wrapper is an environment-level permission issue rather than a product-code contract issue, because the underlying tenant-web `tsc --noEmit` check passed

## Lane Plan
- lane_plan: mode=CROSS_STACK_SEQUENTIAL; lanes=backend, frontend

- be_goal: extend Form Builder authoring persistence and API payloads so model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema` become the canonical backend contract with compatibility reads for older drafts
- be_allowed_scope: `platform/backend/modules/tenant/platformstudioformbuilder/**`, tenant runtime wiring in `cmd/api-tenant`, tenant migrations if required for metadata shape or columns, and only the minimum bundle/migration regeneration needed by the new contract
- be_likely_files_or_modules: `modules/tenant/platformstudioformbuilder`, `cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`, tenant migrations under `migrations/postgres/tenant`, shared DTO/validation helpers if they already belong to this module
- be_locked_constraints: do not reopen publish lifecycle; do not collapse `layoutBlueprint` into `uiSchema`; do not make `Create View` an empty shell; keep stable keys as route identity; keep `Copy View` as an exact `uiSchema` clone; prefer lazy compatibility migration over destructive rewrites
- be_required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`, `platform/frontend/docs/platform-studio/form-builder-first-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/backend/AGENTS.md`
- be_required_checks: `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`
- be_expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/backend.md

- fe_goal: refactor `tenant-web` Form Builder state and workspace behavior to operate on three explicit schemas, make the default view the blueprint editor, seed `Add View` from model schemas, preserve `Copy View` behavior, expose `Unplaced fields`, and upgrade the debug modal to three-schema output
- fe_allowed_scope: `platform/frontend/apps/tenant-web/src/features/platform-studio/**`, `platform/frontend/packages/api-client/**` if transport contracts must widen, supporting locales, and only the minimum shared contract updates needed to represent the new payload split
- fe_likely_files_or_modules: `apps/tenant-web/src/features/platform-studio/forms/forms-builder-state.ts`, `forms-authoring-context.tsx`, `forms-placeholder-data.ts`, `pages/forms-ui-schema-workspace-page.tsx`, `pages/forms-index-page.tsx` if view creation UX changes, locales, and `packages/api-client`
- fe_locked_constraints: do not silently regenerate `uiSchema` on every open; reconcile against `dataSchema + layoutBlueprint` instead; do not silently push unresolved fields into `root`; blueprint-mutating actions should be restricted to the default view in the first rollout; debug modal must show all three schemas explicitly
- fe_required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`, `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`, `platform/frontend/AGENTS.md`
- fe_required_checks: `pnpm --filter @platform/tenant-web typecheck`; `pnpm --filter @platform/api-client typecheck` and `pnpm --filter @platform/api-client test` if transport helpers change
- fe_expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/frontend.md

## Success Criteria
- success_criteria: `Create Model` initializes empty model `dataSchema` and empty `layoutBlueprint` plus default view `uiSchema`; default-view edits can persist model fields and blueprint structure; `Add View` reproduces blueprint structure including `Section`, `Tabs`, `Tab item`, `Accordion`, `Accordion item`, `Grid`, `Column`, `Group`, and `Subform`; `Copy View` preserves source UI exactly; open/reload reconcile can materialize missing fields and missing blueprint containers without falling back to raw `root`; unresolved placement surfaces as `Unplaced fields`; debug modal shows `Data Schema`, `Layout Blueprint`, and `UI Schema`

## Memory and Risk
- memory_sources_read: `platform/docs/ai/current-state.md`, `platform/docs/ai/decisions-log.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/README.md`, `platform/frontend/docs/platform-studio/form-builder-first-contract.md`, `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md`
- memory_update_targets: current-state.md | decisions-log.md | modules/platform-studio.md
- approvals_required: none for in-repo code/doc work
- risks: backward compatibility for older stored drafts can drift if backend/frontend derive blueprint differently; default-view-only blueprint editing must be reflected clearly in UI to avoid accidental expectations in non-default views; debug output and save payloads must move together or troubleshooting will become misleading

## Control Progress
- next_control_step: Atlas has reconciled the completed backend and frontend lanes against the locked three-schema contract with no contract drift, has applied shared-memory updates, and can close the run with one explicit check gap recorded for the blocked `pnpm --filter @platform/tenant-web typecheck` wrapper
- checkpoint_notes: this task intentionally started from the new contract rather than from the older model/view authoring start run; the previous run remains valid historical context but does not override the three-schema contract; backend landed the canonical persistence/compatibility split, frontend landed the canonical three-surface workspace and default-view-only blueprint gating, and no correction packet was required

## Ready Chat Launch Prompt

Use `platform/docs/ai/prompts/control-prompt-v1.md` as the base prompt.

Task:
Run a new cross-stack implementation packet for the Form Builder three-schema rollout.

Primary source of truth:
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`

Goal:
Implement the next stable Form Builder architecture where:
- `ps_model.definition_json` owns `dataSchema`
- `ps_model.definition_json` owns `layoutBlueprint`
- `ps_view.definition_json` owns `uiSchema`
- the `default` view is the first stable editor for model-owned blueprint structure
- `Add View` seeds a fresh `uiSchema` from `dataSchema + layoutBlueprint`
- `Copy View` remains an exact `uiSchema` clone
- unresolved field placement surfaces as explicit `Unplaced fields`
- debug modal shows `Data Schema`, `Layout Blueprint`, and `UI Schema`

Required reads:
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/modules/platform-studio.md`
- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md`
- `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/task.md`

Execution expectations:
- produce a backend lane packet first
- after backend packet is confirmed, produce a frontend lane packet
- keep the rollout constrained to the three-schema contract
- do not reopen publish/navigation scope
- do not allow unresolved placement to silently fall back to `root`
- include compatibility handling for older stored drafts

Expected outputs:
- `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/backend.md`
- `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/frontend.md`
- updated `task.md` status checkpoints as Atlas progresses

Return shape:
- exact routing decision
- lane order and rationale
- locked assumptions
- backend launch prompt
- frontend launch prompt
- risks to watch during reconciliation

## Final Closeout
- final_status: completed
- shared_memory_updates_applied: `platform/docs/ai/current-state.md`, `platform/docs/ai/decisions-log.md`, and `platform/docs/ai/modules/platform-studio.md` updated to reflect the landed three-schema rollout
- unresolved_items: the wrapper command `pnpm --filter @platform/tenant-web typecheck` remains blocked by local frontend config permissions under `platform/frontend/.local/config/caddy`, although the underlying `tsc --noEmit` check passed from the tenant-web app
- archive_recommendation: ready to close as completed historical execution context
