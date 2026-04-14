---
template_id: lane-report
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-13
---

# LANE FILE

## Metadata
- task_id: 2026-04-13_cross-stack_form-builder-three-schema-rollout-start
- lane: backend
- status: completed
- report_time: 2026-04-13 17:09:53 -0400
- prompt_version: 1.1.0
- control_prompt_version: 1.4.1
- author: Codex

## Launch Metadata
- base_prompt_file: platform/docs/ai/prompts/backend-prompt-v1.md
- base_prompt_version: 1.1.0
- prompt_variant: full
- launch_prompt_status: executed

## Ready Chat Launch Prompt
```text
Use `platform/docs/ai/prompts/backend-prompt-v1.md` as the base prompt.

Task:
Implement the backend lane for run `2026-04-13_cross-stack_form-builder-three-schema-rollout-start` and lock the backend side of the Form Builder three-schema rollout.

Primary source of truth:
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`

Required reads:
- `platform/AGENTS.md`
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/modules/platform-studio.md`
- `platform/backend/AGENTS.md`
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`
- `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/task.md`
- `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/backend.md`

Goal:
Lock backend authoring persistence and transport so:
- `ps_model.definition_json` owns `dataSchema`
- `ps_model.definition_json` owns `layoutBlueprint`
- `ps_view.definition_json` owns `uiSchema`
- canonical `/authoring` load returns explicit split `draft.model.{dataSchema,layoutBlueprint}` and `draft.view.uiSchema`
- canonical `/authoring` save accepts the same split
- `Create Model` initializes empty `dataSchema`, empty `layoutBlueprint`, and default-view `uiSchema`
- `Create View` seeds a fresh `uiSchema` from current `dataSchema + layoutBlueprint`
- `Copy View` clones the source `uiSchema` exactly and aligns the new view to current `modelStructureVersion`
- compatibility load for older drafts can derive missing `layoutBlueprint` from the current default view and persist the new shape on next successful save

Allowed scope:
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- tenant migrations only if they are strictly required for metadata shape support
- minimal DTO or validation helpers already owned by this module

Likely files or modules:
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- tenant migrations under `platform/backend/migrations/postgres/tenant`

Locked constraints:
- keep backend/frontend contract stability explicit
- do not reopen publish lifecycle
- do not collapse `layoutBlueprint` into `uiSchema`
- do not make `Create View` an empty shell
- keep stable keys as route identity
- keep `Copy View` as an exact `uiSchema` clone
- prefer lazy compatibility migration over destructive rewrites
- validation must enforce `schemaScopeId`, `containerKey`, subform anchors, `tab_item -> tabs`, and `accordion_item -> accordion`

Out of scope:
- frontend workspace/state refactor
- publish/runtime rendering
- Navigation Builder or Action Builder
- broad auth/session or tenancy changes
- destructive migration workflow unless you confirm it is unavoidable and return that as a blocker

Required checks:
- `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`

Expected return shape:
- use the backend lane response contract from `platform/docs/ai/prompts/backend-prompt-v1.md`
- update `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/backend.md`
- include changed files, API or payload changes, migration impact, compatibility strategy, checks run, remaining blockers, proposed memory deltas, and a clear recommendation for Atlas on whether frontend can proceed without a correction packet

Reminder:
- Atlas owns final shared-memory updates to `current-state.md`, `decisions-log.md`, and `modules/platform-studio.md`
- propose memory deltas only; do not finalize them in this lane
```

## Control Packet Snapshot
- assigned_goal: extend Form Builder authoring persistence and API payloads so model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema` become the canonical backend contract with compatibility reads for older drafts
- why_now: the three-schema contract is now locked and frontend view seeding plus reconcile behavior depends on a stable backend persistence and transport split
- allowed_scope: `platform/backend/modules/tenant/platformstudioformbuilder/**`, tenant runtime wiring in `cmd/api-tenant`, tenant migrations if required for metadata shape or columns, and only the minimum bundle or migration regeneration needed by the new contract
- likely_files_or_modules: `modules/tenant/platformstudioformbuilder`, `cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`, tenant migrations under `migrations/postgres/tenant`, shared DTO or validation helpers if they already belong to this module
- locked_constraints: do not reopen publish lifecycle; do not collapse `layoutBlueprint` into `uiSchema`; do not make `Create View` an empty shell; keep stable keys as route identity; keep `Copy View` as an exact `uiSchema` clone; prefer lazy compatibility migration over destructive rewrites
- out_of_scope: frontend workspace behavior, publish/runtime rendering finalization, Navigation Builder, Action Builder, destructive migration workflow beyond the minimum required for the metadata contract
- required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`, `platform/frontend/docs/platform-studio/form-builder-first-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/backend/AGENTS.md`
- required_checks: `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`
- expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-rollout-start/backend.md
- memory_delta_expectation: propose deltas only; Atlas reconciles and applies shared memory updates

## Analysis Snapshot
- locked_invariants: Form Builder `Save` is authoring save only; route params `modelId/viewId` carry immutable stable keys; canonical transport naming stays `/authoring`; `Add View` is not `Copy View`; `Copy View` must remain an exact `uiSchema` clone; unresolved placement must never silently fall back to raw `root`; the `default` view is the first stable editor for model-owned blueprint structure
- confirmed_facts: the three-schema contract makes backend persistence ownership explicit; backend already owns model/view authoring routes and metadata rows; compatibility rollout is intended to stay lazy and non-destructive in the first pass
- assumptions: existing DTO and validation layers can widen to explicit `draft.model` and `draft.view` split without reopening unrelated authoring flows; if JSON-only compatibility works, no new SQL columns are required in this slice
- change_classification: transport-coupled, schema-sensitive

## Lane Return Report
- touched_files:
  - `platform/backend/modules/tenant/platformstudioformbuilder/authoring_schema.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/service.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/service_test.go`
- summary_of_changes: backend authoring storage is now normalized around model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`; create/copy/load/save all flow through the same canonicalizer, while `/authoring` responses still include compatibility mirrors for the current frontend draft model and legacy v3 view document shape.
- checks_run:
  - `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`
- checks_still_needed: frontend lane only
- blockers: none
- unresolved_risks: compatibility-derived `containerKey` naming now comes from deterministic backend synthesis over the default view hierarchy; frontend reconcile should consume those keys as canonical rather than regenerating its own alternate naming
- contract_drift: no
- proposed_memory_deltas:
  - `platform/docs/ai/current-state.md`: note that Form Builder backend persistence now stores model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`, and that `/authoring` load/save exposes the explicit three-schema split with lazy compatibility migration for older drafts
  - `platform/docs/ai/decisions-log.md`: record that backend canonicalized storage around the three-schema split without a destructive migration and kept compatibility reads/writes lazy
  - `platform/docs/ai/modules/platform-studio.md`: update the backend-ready slice bullets so backend load/save/create/copy are described in terms of the three-schema contract rather than the older model-fields plus view-document draft shape
- next_lane_step: hand this report to Atlas and start the frontend lane against the locked backend payload/compatibility packet

## Restate
Implement the backend lane for the Form Builder three-schema rollout so `ps_model.definition_json` is canonical for `dataSchema` and `layoutBlueprint`, `ps_view.definition_json` is canonical for `uiSchema`, `/authoring` load/save uses that split explicitly, `Create View` seeds from model schemas, and old two-surface drafts migrate lazily on read and next save.

## Locked Invariants
- `Save` remains authoring save only
- route params stay on immutable stable keys
- canonical transport stays `/authoring`
- `Create View` is not an empty shell
- `Copy View` stays an exact `uiSchema` clone
- `layoutBlueprint` stays model-owned and is not collapsed into `uiSchema`
- unresolved placement must not silently become raw `root`
- validation must enforce `schemaScopeId`, `containerKey`, subform anchors, `tab_item -> tabs`, and `accordion_item -> accordion`

## Confirmed Facts
- the backend module already owned model/view metadata rows, create/copy/delete routes, and canonical `/authoring` load/save
- the previous stored model shape was still field/screen oriented and the view shape was still a persisted workspace document
- the required rollout can stay JSON-only; no column or migration change is required for the first pass

## Assumptions
- frontend will move to the explicit split next, but the backend should keep compatibility mirrors so the current draft document can still be interpreted during the transition
- lazy compatibility persistence should not bump structure/view versions if the only change is canonical storage normalization

## Change Classification
- transport-coupled
- schema-sensitive
- backend-local within the Form Builder tenant module

## Plan
- canonicalize stored and incoming model/view payloads into the three-schema shape
- make create/copy/load/save use that canonicalizer
- add validation for the new schema ownership and hierarchy rules
- keep compatibility read/write bridges for older model/view draft JSON
- lock the behavior with service tests

## Implementation
- Storage:
  - added `authoring_schema.go` to canonicalize model payloads to `{dataSchema, layoutBlueprint}` and view payloads to `{uiSchema}`
  - canonical storage strips legacy duplicate top-level draft state after deriving the new schemas
- `/authoring` load:
  - now returns explicit `draft.model.dataSchema`, `draft.model.layoutBlueprint`, and `draft.view.uiSchema`
  - still injects compatibility model mirrors (`fields`, `schemaScopes`) and a compatibility v3 view document (`rootScope/rootView/subformScopes/version=3`) so older draft consumers can still interpret the response during rollout
- `/authoring` save:
  - accepts the explicit split
  - also accepts the older model/view draft shapes by deriving missing canonical schemas before validation and persistence
  - compares canonical existing payloads to canonical incoming payloads, so lazy migration to the new storage shape does not falsely count as a structure edit
- `Create Model`:
  - now seeds empty `dataSchema`, empty `layoutBlueprint`, and a default-view `uiSchema`
- `Create View`:
  - now reads the canonical model schemas and materializes a fresh `uiSchema` from `layoutBlueprint` containers and field placements, including subform anchors
- `Copy View`:
  - now canonicalizes the source first, then clones the source `uiSchema` exactly and resets only the new view metadata/version fields
- Validation:
  - rejects invalid scope references
  - rejects blueprint placements to unknown containers
  - rejects invalid subform anchors
  - rejects `tab_item` under non-`tabs`
  - rejects `accordion_item` under non-`accordion`
- Changed files:
  - `platform/backend/modules/tenant/platformstudioformbuilder/authoring_schema.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/service.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/service_test.go`
- API / payload changes:
  - canonical load/save contract is now three-schema explicit:
    - `draft.model.dataSchema`
    - `draft.model.layoutBlueprint`
    - `draft.view.uiSchema`
  - compatibility response/save support remains in place for the legacy field/scope model shape and the older view workspace document shape
- Migration impact:
  - none
  - no tenant migration SQL, bundle regeneration, or destructive rewrite was required
- Compatibility strategy:
  - when persisted model JSON does not yet contain `layoutBlueprint`, backend derives it lazily from the default view
  - when persisted model/view JSON still uses the older draft shape, backend derives the canonical three-schema payload on load/save
  - the next successful save persists the new canonical shape

## Backend Checks
- passed: `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`

## Risks / Blockers
- no blocker remains for backend
- residual risk is cross-lane only: frontend reconcile should trust backend-issued `containerKey` values for compatibility-derived drafts instead of inventing a second naming scheme

## Proposed Memory Deltas
- `platform/docs/ai/current-state.md`
  - record that the backend now persists the three-schema authoring split and exposes it explicitly from `/authoring`
- `platform/docs/ai/decisions-log.md`
  - append that backend rollout used lazy read/write compatibility with no destructive migration
- `platform/docs/ai/modules/platform-studio.md`
  - replace the “next locked target” wording with “backend landed” wording for the three-schema persistence/load/save/create/copy slice

## Lane Report Summary
- backend authoring persistence and transport are locked to the three-schema split
- no migration blocker was encountered
- required checks passed
- frontend can proceed without a correction packet

## Reconciliation Readiness
- ready_for_reconciliation: yes
- ready_for_closeout: yes
- recommended_next_control_action: backend lane is reconciled with the completed frontend lane; Atlas can close the run, apply shared-memory deltas, and record the remaining frontend wrapper-check gap
