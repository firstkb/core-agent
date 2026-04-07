---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-07
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-07_cross-stack_platform-studio-naming-contract-lock
- title: Platform Studio naming and contract lock
- status: active
- created_at: 2026-04-07 15:14:29 -0400
- updated_at: 2026-04-07 15:51:00 -0400
- created_by: Atlas
- skill_name: ramp-conductor
- skill_display_name: Atlas
- skill_version: 1.4.0
- control_prompt_version: 1.4.0
- frontend_prompt_version: 1.1.0
- backend_prompt_version: 1.1.0

## Routing Decision
- run_required: yes
- primary_mode: RESEARCH_CONTRACT_LOCK
- recommended_chat_topology: CONTROL_ONLY
- active_lanes: none
- execution_order: research first
- scaffolder_action: created via new-run 1.3.0
- run_artifact_scope: platform/docs/ai/runs/2026-04-07_cross-stack_platform-studio-naming-contract-lock/

## Goal
- goal: Lock the product taxonomy, technical naming, and first cross-stack contract for Platform Studio before continuing Form Builder delivery and backend integration.
- why_now: Current tenant-web Form Builder has outgrown pure scaffold status, but backend builder contracts are not yet implemented and naming drift is already visible across docs, routes, packages, and user-facing copy.
- business_or_technical_value: Prevent FE and BE from implementing incompatible builder concepts, reduce naming drift before more tools are added, and define the exact point when Form Builder work should switch from local prototype into real cross-stack integration.

## Scope
- in_scope: lock the umbrella product name, lock tool names under Platform Studio, align Form Builder domain language, define the initial FE/BE contract boundary for Model and View authoring, and define the recommended delivery order from naming cleanup into backend integration.
- out_of_scope: full repository-wide renames in one pass, Navigation Builder implementation, Action Builder implementation, final publish workflow, final transport style, and final database/migration design for all future Studio tools.

## Locked Invariants
- locked_invariants: Platform Studio is the umbrella tenant authoring surface; Form Builder is the first active tool and owns Model plus View authoring; Navigation Builder will own sidebar composition, module creation from Views, and access privilege control; Action Builder will own event-driven behavior attached to authored Views and must not be prematurely collapsed into the current workflow-only contract; backend owns persistence, lock enforcement, storage naming, and validation; frontend must not treat current localStorage placeholder shapes as the final shared contract.

## Confirmed Shared Contract
- confirmed_shared_contract: user-facing FE language should use Platform Studio, Form Builder, Model, and View; shared technical contract should converge on ModelDefinition plus ViewDefinition rather than the older EntityDefinition naming; Navigation and Action surfaces remain part of the Studio bundle, but only Form Builder is in the first active implementation slice; backend integration should begin after naming and draft-shape lock, not after full FE completion.

## Facts and Assumptions
- code_confirmed_facts: package rename is now applied at the frontend workspace level as `@platform/platform-studio-core`; tenant-web now uses Platform Studio route helpers with canonical `modelId` and `viewId` params plus legacy redirects and compatibility aliases; Form Builder authoring still includes palette, canvas, node editing, drag reorder, dirty-state, and save behavior backed by localStorage; platform-studio-core now exports `ModelDefinition` and `ModelFieldDefinition` while retaining `EntityDefinition` and `FieldDefinition` as compatibility aliases.
- doc_confirmed_facts: canonical Platform Studio docs now include a locked taxonomy and naming matrix plus a locked first Form Builder contract; current-state, decisions-log, and module memory now record Platform Studio as the umbrella surface with Form Builder active and Navigation Builder plus Action Builder planned; the backend-boundary doc keeps ModelDefinition, ModelFieldDefinition, ViewDefinition, LayoutNode, LockPolicy, and StorageBinding as the target shared contract language.
- inferred_facts: current FE is already beyond a purely visual scaffold, so continuing UI work without locking names and payload shape will create avoidable contract drift; Action Builder overlaps with the existing workflow contract, but the current workflow surface is narrower than the product concept the owner described.
- assumptions: English technical names remain the canonical code-level naming set; user-facing copy may stay simpler than technical contracts; backend should start with the Form Builder slice only, while Navigation Builder and Action Builder remain contract placeholders until their first active slice begins.

## Lane Plan
- lane_plan: mode=RESEARCH_CONTRACT_LOCK; lanes=none
- fe_goal: no implementation lane during contract lock; FE implementation should begin only after the naming matrix and first draft contract are locked.
- fe_allowed_scope: current control pass may inspect tenant-web builder naming, route, package, and local authoring surfaces only.
- fe_likely_files_or_modules: platform/frontend/apps/tenant-web/src/features/platform-studio/** | platform/frontend/apps/tenant-web/src/locales/* | platform/frontend/packages/platform-studio-core/**
- fe_locked_constraints: do not ship more placeholder-driven feature breadth until the contract lock is complete; do not let current platform-studio naming become the durable Studio taxonomy.
- fe_required_reads: platform/docs/ai/modules/platform-studio.md | platform/frontend/docs/platform-studio/v2-foundation-brief.md | platform/frontend/docs/platform-studio/form-builder-backend-boundary.md
- fe_required_checks: naming matrix review against current code surfaces; route and locale review; shared-contract drift review.
- fe_expected_report_path:
- be_goal: no implementation lane during contract lock; BE implementation should begin after the first Form Builder contract is locked for Model and View persistence.
- be_allowed_scope: control pass may inspect backend builder readiness and identify missing runtime modules only.
- be_likely_files_or_modules: platform/backend/modules/** | platform/backend/cmd/api-tenant/** | platform/frontend/docs/platform-studio/form-builder-backend-boundary.md
- be_locked_constraints: do not bind backend design to temporary FE localStorage payloads; do not start Navigation Builder or Action Builder backend surfaces during the first Form Builder integration slice.
- be_required_reads: platform/backend/AGENTS.md | platform/docs/ai/current-state.md | platform/frontend/docs/platform-studio/form-builder-backend-boundary.md | platform/frontend/docs/platform-studio/data-schema-storage-rules.md
- be_required_checks: confirm missing runtime module coverage; confirm first-save contract boundary; confirm lock and storage responsibilities stay backend-owned.
- be_expected_report_path:

## Prompt Delivery
- prompt_delivery_status: pending
- frontend_launch_prompt_path:
- backend_launch_prompt_path:
- direct_launch_prompt_required: no
- prompt_delivery_notes: no FE or BE implementation lane should be launched until the control pass writes the final naming matrix and the initial Form Builder payload boundary.

## Memory and Risk
- memory_sources_read: platform/AGENTS.md | platform/docs/ai/README.md | platform/docs/ai/current-state.md | platform/docs/ai/canonical-docs.md | platform/docs/ai/modules/platform-studio.md | platform/frontend/AGENTS.md | platform/frontend/docs/README.md | platform/frontend/docs/platform-studio/README.md | platform/frontend/docs/platform-studio/v2-foundation-brief.md | platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md | platform/frontend/docs/platform-studio/data-schema-storage-rules.md | platform/frontend/docs/platform-studio/form-builder-backend-boundary.md | platform/frontend/docs/platform-studio/form-builder-field-catalog.md | platform/backend/AGENTS.md
- memory_update_targets: current-state.md | decisions-log.md | modules/platform-studio.md | canonical-docs.md | frontend docs Platform Studio canonical set
- approvals_required: owner decision is now needed only for what starts next after the contract lock checkpoint: more FE cleanup, first backend slice, or coordinated FE/BE integration.
- risks: Form Builder state and placeholder substrate still retain some older object/screen-shaped internal helpers for compatibility; publish/runtime payloads still carry legacy `entities` and `fields` keys; Navigation Builder and Action Builder remain conceptually defined but not yet contract-shaped beyond the current naming matrix.

## Control Progress
- next_control_step: wait for owner decision on the next implementation slice after the lock: continue deeper FE cleanup inside Form Builder internals, start the first backend Form Builder persistence slice, or open coordinated FE/BE execution against the now-locked contract.
- checkpoint_notes: naming matrix, package rename, canonical route cleanup, shared contract aliases, and first Form Builder contract lock are now applied; shared memory was updated and frontend verification passed with tenant-web typecheck plus targeted Platform Studio vitest coverage.

## Final Closeout
- final_status: checkpointed
- shared_memory_updates_applied: yes
- unresolved_items: choose the next slice after the lock checkpoint; decide whether to spend one more FE pass on internal form-builder substrate naming or move directly into backend integration against the locked contract
- archive_recommendation: archive only after closeout and inactivity
