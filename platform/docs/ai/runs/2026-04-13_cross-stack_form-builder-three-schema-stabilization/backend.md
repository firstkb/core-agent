---
template_id: lane-report
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-13
---

# LANE FILE

## Metadata
- task_id: 2026-04-13_cross-stack_form-builder-three-schema-stabilization
- lane: backend
- status: completed
- report_time: 2026-04-13 20:29:40 -0400
- prompt_version: 1.1.0
- control_prompt_version: 1.4.1
- author: Atlas

## Launch Metadata
- base_prompt_file: platform/docs/ai/prompts/backend-prompt-v1.md
- base_prompt_version: 1.1.0
- prompt_variant: full
- launch_prompt_status: ready

## Ready Chat Launch Prompt
```text
Use `platform/docs/ai/prompts/backend-prompt-v1.md` as the base prompt.

Atlas packet:
You are the backend lane for `2026-04-13_cross-stack_form-builder-three-schema-stabilization`.

Primary source of truth:
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`

Required reads:
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/modules/platform-studio.md`
- `platform/backend/AGENTS.md`
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`
- `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/task.md`

Assigned goal:
Harden backend Form Builder authoring so canonical model/view operations resolve strictly by `viewId`, never by `view.key`, while preserving the three-schema split and expanding tests to cover the actual production invariants.

Allowed scope:
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- minimum DTO/helper changes required by strict identity semantics

Code-confirmed problems you must address:
- `repository.go` still resolves and mutates views through `(view_id = $2 OR view_key = $2)` in load/update/delete paths
- tests still contain legacy fixtures where `ViewID == "default"` and therefore do not lock `viewId != viewKey`
- this green suite currently permits the exact identity drift the owner wants eliminated

Locked constraints:
- keep `ps_model.definition_json` as canonical owner of `dataSchema + layoutBlueprint`
- keep `ps_view.definition_json` as canonical owner of `uiSchema`
- do not reopen publish or DDL scope
- `Create Model` must seed a real default view with distinct `viewId` and `viewKey=default`
- `Create View` must seed a fresh coherent `uiSchema` from current model-owned schemas
- `Copy View` must clone source `uiSchema` exactly but get a new `viewId`
- canonical route/open/load/save/delete semantics must resolve by `viewId`, not by `view.key`

Required checks:
- `go test ./modules/tenant/platformstudioformbuilder/...`
- add or update tests for:
  - strict `viewId` load/update/delete resolution
  - default view seeded with `viewId != viewKey`
  - copy view new id + preserved `uiSchema`
  - delete safety when `viewId` and `viewKey` differ

Expected return shape:
- lane status
- touched files
- summary of changes
- checks run
- checks still needed
- blockers
- unresolved risks
- contract drift (`yes` or `no`)
- proposed memory deltas
- next lane step

Atlas owns final shared-memory updates. Do not finalize `current-state.md` or other shared memory files directly.
```

## Control Packet Snapshot
- assigned_goal: Remove backend `viewId/viewKey` ambiguity from Form Builder authoring operations and expand tests so the backend enforces the same identity and three-schema invariants the docs require.
- why_now: Backend permissive resolution currently allows the exact open/save/delete drift called out by the owner, and the frontend cannot be safely stabilized while canonical identity remains ambiguous at the repository layer.
- allowed_scope: `platform/backend/modules/tenant/platformstudioformbuilder/**`, `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`, and minimum DTO/helper updates required by strict identity semantics.
- likely_files_or_modules: `repository.go`, `service.go`, `model.go`, `handler.go`, `service_test.go`, `authoring_schema.go`
- locked_constraints: preserve three-schema persistence split; do not reintroduce `view.key` compatibility in canonical flows; keep create/copy semantics aligned to the locked contract; keep publish and DDL out of scope.
- out_of_scope: frontend state refactor, UI gating, debug modal, package boundary changes outside the minimum transport metadata needed by backend.
- required_reads: `platform/docs/ai/current-state.md`; `platform/docs/ai/modules/platform-studio.md`; `platform/backend/AGENTS.md`; `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`; `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`; `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`; `platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/task.md`
- required_checks: `go test ./modules/tenant/platformstudioformbuilder/...`; strict `viewId` fixture coverage for load/update/delete/create/copy
- expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-three-schema-stabilization/backend.md
- memory_delta_expectation: propose shared-memory deltas only; Atlas finalizes

## Analysis Snapshot
- locked_invariants: backend canonical identity is `viewId`; `viewKey` remains distinct metadata; `ps_model` owns `dataSchema + layoutBlueprint`; `ps_view` owns `uiSchema`; create/copy/delete/open/save must remain aligned to the three-schema contract.
- confirmed_facts: repository load/update/delete currently use `(view_id OR view_key)`; green backend tests do not yet pin the required distinct default-view identity because legacy fixtures still use `ViewID == "default"` in several cases.
- assumptions: tightening backend identity semantics first will surface any remaining frontend key-based fallbacks quickly and make later FE regression fixes more deterministic.
- change_classification: backend-first stabilization plus targeted refactor and regression hardening

## Lane Return Report
- touched_files: `platform/backend/modules/tenant/platformstudioformbuilder/repository.go`; `platform/backend/modules/tenant/platformstudioformbuilder/service.go`; `platform/backend/modules/tenant/platformstudioformbuilder/service_test.go`
- summary_of_changes: tightened repository `open/load/update/delete` view resolution to `view_id` only; refactored view key/id generation to use explicit existing-view sets instead of permissive `GetView`; preserved backend draft compatibility metadata by including `isDefault` alongside distinct `id` and `key` in screen payloads; hardened the in-memory repository and canonical fixtures so tests now enforce `viewId != viewKey` for the default view and reject `viewKey` fallback in open/load/save/delete flows; kept create/copy semantics aligned to the three-schema contract.
- checks_run: `go test ./modules/tenant/platformstudioformbuilder/...`
- checks_still_needed: frontend lane identity/state regression pass and control-level cross-stack reconciliation across create/open/save/copy/delete flows.
- blockers: none
- unresolved_risks: frontend may still have key-based route/bootstrap fallbacks until its lane is completed; backend coverage is targeted service-level coverage and does not include a live Postgres integration pass in this lane.
- contract_drift: no
- proposed_memory_deltas: no durable shared-memory delta is required from the backend lane alone because the existing docs already claim strict `viewId` semantics; Atlas can optionally note in run closeout that backend implementation now matches the locked contract once the frontend lane also reconciles.
- next_lane_step: launch the frontend lane against the hardened backend contract and remove any remaining `view.key`-based identity or default-view heuristics.

## Reconciliation Readiness
- ready_for_reconciliation: yes
- ready_for_closeout: no
- recommended_next_control_action: Start the frontend lane now, then run the cross-stack regression matrix against the strict `viewId` backend behavior before control closeout
