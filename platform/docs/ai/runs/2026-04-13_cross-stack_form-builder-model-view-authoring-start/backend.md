---
template_id: lane-report
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# LANE FILE

## Metadata
- task_id: 2026-04-13_cross-stack_form-builder-model-view-authoring-start
- lane: backend
- status: active
- report_time: 2026-04-13 11:03:26 -0400
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

Task:
Start the real Form Builder backend implementation from the model/view authoring lifecycle, not from publish/status mechanics.

Goal:
Deliver the first backend slice for:
- add model
- list model
- model detail with list view
- add view
- copy view
- delete view
- load/save current Form Builder authoring state
- separate persisted lock flags for model and view

Context already locked:
- Form Builder `Save` is authoring save only, not site publish.
- Navigation Builder will later own site exposure and privileges.
- Route params keep the names `modelId` and `viewId`, but the values are immutable stable keys.
- Titles are never identifiers.
- GUID is internal DB identity only.
- Model/view `status` is not part of the first mandatory contract.
- Current `/draft` route naming is only a temporary technical alias for authoring state.
- `root` may lock `model` and `view` separately.
- `modelStructureVersion` is integer only.

Recommended V1 product behavior:
- `Add Model` modal asks only for model title.
- Backend should create the model plus the first default view in one action if possible.
- The frontend should be able to redirect directly into Form Builder for that first view.
- If you decide a separate create-view call is still required, explicitly explain why and what FE follow-up is needed to avoid leaving the user with a useless model shell.

Required reads:
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/modules/platform-studio.md`
- `platform/backend/AGENTS.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`

Allowed scope:
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/**`
- `platform/backend/migrations/postgres/tenant/**`
- tenant bundle regeneration only if the schema changes

Locked constraints:
- Do not widen publish lifecycle.
- Do not make `status` mandatory for model/view.
- Prefer dedicated boolean columns for row-level `model lock` and `view lock`.
- Keep stable keys readable and immutable.
- Do not use titles as identifiers.
- Do not add destructive migration or generated storage DDL in this slice.

Expected backend deliverables:
- proposed endpoint set for create/list/detail/save/delete/copy
- migration shape for model/view rows and lock columns
- contract for stable key generation
- note on whether create-model also creates the first view
- tests for core handler/service behavior

Required checks:
- `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`
- migration smoke if schema changes
- regenerate tenant bundle if migration changes land

Return shape:
- touched files
- endpoint/migration summary
- checks run
- blockers
- unresolved risks
- explicit note on any contract drift
- proposed shared-memory deltas
```

## Control Packet Snapshot
- assigned_goal: Deliver the first backend authoring slice for model/view creation, listing, copy/delete view behavior, authoring-state load/save, stable key generation, and separate lock columns for model/view.
- why_now: The authoring contract is now stable enough to start real backend implementation from create/list/save model and view flows without broadening the temporary publish/status layer.
- allowed_scope: `platform/backend/modules/tenant/platformstudioformbuilder/**`, `platform/backend/cmd/api-tenant/internal/server/**`, `platform/backend/migrations/postgres/tenant/**`, tenant bundle regeneration only if needed by migration changes.
- likely_files_or_modules: `modules/tenant/platformstudioformbuilder`, tenant API server wiring/routes, tenant migrations, bundle generation.
- locked_constraints: authoring-save only; stable keys as route identity; GUID internal only; no title-based identity; no mandatory model/view status; separate model/view locks; no publish-flow widening; no destructive migration.
- out_of_scope: Navigation Builder, site publish/access, delete model, generated storage DDL, destructive field migration, generalized permissions.
- required_reads: `platform/docs/ai/current-state.md`, `platform/docs/ai/modules/platform-studio.md`, `platform/backend/AGENTS.md`, `platform/frontend/docs/platform-studio/form-builder-first-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md`, `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`, `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`, `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`
- required_checks:
- expected_report_path: platform/docs/ai/runs/2026-04-13_cross-stack_form-builder-model-view-authoring-start/backend.md
- memory_delta_expectation: propose shared-memory deltas only; Atlas finalizes

## Analysis Snapshot
- locked_invariants: Save is authoring-only; route params carry stable keys; model/view status not first mandatory contract; current `/draft` naming is technical alias only; model/view locks are separate; first slice should stay minimal.
- confirmed_facts: current backend already has a temporary authoring-state load/save API and tenant metadata tables; current frontend now uses stable keys and explicit `isActive` view state; durable docs already lock these semantics.
- assumptions: best V1 is create model plus first view in one backend action; separate boolean columns for model/view lock state are preferable to hiding both inside JSON.
- change_classification: cross-stack contract-sensitive backend-first authoring slice

## Lane Return Report
- touched_files:
  - `platform/backend/modules/tenant/platformstudioformbuilder/model.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/repository.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/service.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/handler.go`
  - `platform/backend/modules/tenant/platformstudioformbuilder/service_test.go`
  - `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
  - `platform/backend/cmd/api-tenant/internal/server/wiring_platform_studio_form_builder.go`
  - `platform/backend/migrations/postgres/tenant/041_platform_studio_form_builder_authoring_locks.sql`
  - `platform/backend/bundle/tenant_schema_full.sql`
- summary_of_changes:
  - Added the first real Form Builder backend slice for model/view authoring: list models, create model, get model detail, list views, create view, copy view, delete view, load draft, and save draft.
  - Made create-model seed the first default view in the same backend action so the frontend can redirect straight into the new view instead of landing on a useless model shell.
  - Split persisted row-level locks into dedicated `model_locked` and `view_locked` columns while keeping `status` optional for this slice.
  - Added stable-key generation and validation around immutable route keys, with titles used only as display inputs.
  - Regenerated the tenant schema bundle after the migration landed.
- checks_run:
  - `go test ./cmd/api-tenant/... ./modules/tenant/platformstudioformbuilder/...`
  - `go run ./tools/generate_bundle.go`
  - `go run ./cmd/migrate --env ./env/migrate.local.env.example`
- checks_still_needed:
  - FE integration against the new model/view endpoints and the seeded first-view redirect path.
  - End-to-end verification of authoring state load/save with the frontend contract.
- blockers:
  - None in the backend slice itself.
- unresolved_risks:
  - Legacy authoring payloads may still need frontend normalization before the new endpoints are used broadly.
  - The `/draft` path remains a temporary technical alias and still needs the planned frontend follow-up to stay aligned with the authoring-only contract.
- contract_drift: no
- proposed_memory_deltas:
  - Form Builder backend authoring now has a real model/view lifecycle instead of publish/status-first mechanics.
  - Create model seeds the first default view in one action.
  - Model and view locks are persisted separately in dedicated columns.
  - Stable route keys remain immutable and title-derived only at creation time.
- next_lane_step:
  - Hand off to frontend for endpoint wiring, seeded-view redirect, and authoring-state contract alignment.

## Reconciliation Readiness
- ready_for_reconciliation: yes
- ready_for_closeout: no
- recommended_next_control_action: Reconcile backend slice with frontend authoring flow and validate cross-stack contract alignment
