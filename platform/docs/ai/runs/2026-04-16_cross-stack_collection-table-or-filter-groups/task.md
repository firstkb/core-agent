---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-16_cross-stack_collection-table-or-filter-groups
- title: [cross-stack] Collection Table OR Filter Groups
- status: draft
- created_at: 2026-04-16 11:09:47 -0400
- updated_at: 2026-04-16 11:09:47 -0400
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
- run_artifact_scope: platform/docs/ai/runs/2026-04-16_cross-stack_collection-table-or-filter-groups/

## Goal
- goal: Add grouped OR behavior for repeated contains filters on the same field, including saved-filter persistence.
- why_now: The shared collection-table package is moving toward cross-app reuse and current AND-only quick filters block expected search behavior.
- business_or_technical_value:
  implicit OR groups unblock expected same-field search behavior without changing saved-filter storage shape, which keeps the shared collection-table contract backward-compatible for admin now and tenant reuse later.

## Scope
- in_scope:
  collection-table runtime token grouping, backend same-field contains evaluation, proving-surface coverage in admin module-registry and employees, and contract/memory docs for saved-filter persistence.
- out_of_scope:
  explicit user-selectable AND/OR builders, non-contains grouping semantics, tenant app consumer wiring, and any database migration for saved filters.

## Locked Invariants
- locked_invariants:
  repeated contains filters must keep substring semantics; saved filters must persist the underlying quickFilters array without a schema migration; different fields and non-grouped operators must remain AND-composed; module-registry proving-surface assumptions must not become a tenant-specific contract.

## Confirmed Shared Contract
- confirmed_shared_contract:
  frontend may continue to send repeated quickFilters entries; repeated contains entries on the same field are displayed as one grouped token and evaluated as OR within that field on the backend; persistence stores the original quickFilters entries exactly.

## Facts and Assumptions
- code_confirmed_facts:
  collection-table quick filters currently persist as an array of {fieldId, operator, value}; active tokens were rendered one-to-one from that array; admin employees and module-registry services each evaluated quick filters with pure AND semantics.
- doc_confirmed_facts:
  collection-table is a shared runtime/package domain and saved filters are part of the stable reusable capability set.
- inferred_facts:
  the cheapest backward-compatible path is to preserve payload/storage shape and change evaluation plus presentation semantics rather than introducing a new saved-filter schema.
- assumptions:
  current product intent is implicit OR only for repeated same-field contains filters and not a general nested boolean-expression builder.

## Lane Plan
- lane_plan: mode=CROSS_STACK_SEQUENTIAL; lanes=frontend, backend
- fe_goal:
  group repeated same-field contains filters into one runtime token label while leaving quickFilters persistence unchanged.
- fe_allowed_scope:
  @platform/collection-table runtime/page helpers, runtime docs, and targeted runtime tests only.
- fe_likely_files_or_modules:
  platform/frontend/packages/collection-table/src/*
- fe_locked_constraints:
  do not change CollectionTableQueryRequest or saved-filter payload shape; keep token removal predictable and session-storage persistence backward-compatible.
- fe_required_reads:
  platform/docs/ai/modules/collection-table.md; platform/frontend/docs/collection-table-runtime-contract.md; platform/frontend/packages/collection-table/src/collection-table-page.tsx; platform/frontend/packages/collection-table/src/collection-table-runtime.ts
- fe_required_checks:
  pnpm --filter @platform/collection-table typecheck; pnpm exec vitest run src/collection-table-runtime.test.ts; pnpm --filter @platform/platform-admin-web typecheck
- fe_expected_report_path: platform/docs/ai/runs/2026-04-16_cross-stack_collection-table-or-filter-groups/frontend.md
- be_goal:
  evaluate repeated same-field contains filters as OR groups while preserving AND semantics across other filter groups and saved-filter persistence.
- be_allowed_scope:
  shared collectiontable helpers, admin employees/module-registry proving surfaces, backend tests, and integration docs only.
- be_likely_files_or_modules:
  platform/backend/modules/shared/collectiontable/*; platform/backend/modules/admin/employeeslist/*; platform/backend/modules/admin/moduleregistrylist/*
- be_locked_constraints:
  do not reinterpret contains as exact-match IN; do not change saved-filter DB storage format; keep query validation rules unchanged.
- be_required_reads:
  platform/frontend/docs/collection-table-backend-integration-contract.md; platform/backend/modules/shared/collectiontable/*; platform/backend/modules/admin/employeeslist/service.go; platform/backend/modules/admin/moduleregistrylist/service.go
- be_required_checks:
  go test ./modules/shared/collectiontable ./modules/admin/employeeslist ./modules/admin/moduleregistrylist
- be_expected_report_path: platform/docs/ai/runs/2026-04-16_cross-stack_collection-table-or-filter-groups/backend.md

## Prompt Delivery
- prompt_delivery_status: not-needed-inline-execution
- frontend_launch_prompt_path: platform/docs/ai/runs/2026-04-16_cross-stack_collection-table-or-filter-groups/frontend.md#ready-chat-launch-prompt
- backend_launch_prompt_path: platform/docs/ai/runs/2026-04-16_cross-stack_collection-table-or-filter-groups/backend.md#ready-chat-launch-prompt
- direct_launch_prompt_required: no
- prompt_delivery_notes:
  Atlas executed both lanes inline in the control chat after contract lock; no additional lane chat was opened.

## Memory and Risk
- memory_sources_read:
  platform/docs/ai/modules/collection-table.md; platform/frontend/docs/collection-table-runtime-contract.md; platform/frontend/docs/collection-table-backend-integration-contract.md; platform/docs/ai/current-state.md
- memory_update_targets: current-state.md | decisions-log.md | relevant modules/*.md | canonical-docs.md if authority changed
- approvals_required:
- risks:
  grouped token removal currently removes the whole same-field contains group at once; explicit per-value removal and general boolean filter builders remain deferred.

## Control Progress
- next_control_step: Reconcile frontend/backend output, verify checks, and close the run.
- checkpoint_notes:
  Locked the contract around backward-compatible quickFilters persistence before implementation; avoided a saved-filter migration by grouping only at runtime/evaluation.

## Final Closeout
- final_status: reconciled
- shared_memory_updates_applied: current-state.md plus collection-table frontend/backend contract docs updated
- unresolved_items:
  no explicit OR builder UI yet; grouped contains removal is coarse-grained by token group.
- archive_recommendation: archive only after closeout and inactivity
