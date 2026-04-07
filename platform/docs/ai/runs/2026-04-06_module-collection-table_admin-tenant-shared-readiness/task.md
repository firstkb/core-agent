---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-06_module-collection-table_admin-tenant-shared-readiness
- title: Collection Table admin/tenant shared readiness
- status: closed
- created_at: 2026-04-06 21:21:55 -0400
- updated_at: 2026-04-06 21:22:13 -0400
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
- run_artifact_scope: platform/docs/ai/runs/2026-04-06_module-collection-table_admin-tenant-shared-readiness/

## Goal
- goal: Assess collection-table frontend package readiness and backend shared-service readiness for admin and tenant surfaces
- why_now: Package extraction and shared-service promotion need contract lock before any cross-app rollout
- business_or_technical_value: Lock the extraction boundary before admin-specific transport, styling, and persistence assumptions leak into a supposed universal collection-table contract.

## Scope
- in_scope: Read current collection-table docs, admin proving-surface frontend code, shared/backend helpers, admin wiring, tenant runtime wiring, and existing tests to judge package-readiness and shared-service-readiness.
- out_of_scope: No package extraction, no tenant collection-table rollout, no endpoint redesign, no schema changes, and no durable shared-memory updates.

## Locked Invariants
- locked_invariants: collection-table stays separate from admin-module-registry; shared runtime must not import app code; host pages own endpoint mapping and navigation; package promotion requires a second real consumer or equivalent proof; backend shared helpers must not inherit admin-only semantics; admin and tenant boundaries remain explicit.

## Confirmed Shared Contract
- confirmed_shared_contract: Frontend metadata, row model, query model, and adapter shape are already generic enough to describe a reusable runtime, but the runtime remains app-local until host/runtime separation and reuse proof are complete. Backend generic collection-table types/helpers already exist for meta/query/filter/sort/export support, but the active persistence and route wiring remain admin-only and are not yet a tenant-capable shared service.

## Facts and Assumptions
- code_confirmed_facts: The only real frontend consumer is the admin module-registry page and its app-local shared helpers. Admin transport reads `adminApiUrl` and hardcodes `/app/admin/module-registry/list/*`. The reusable surface still renders through admin-web styling and toolbar composition. Shared Go collection-table types/helpers exist and are reused by `moduleregistrylist`. Collection preferences persistence is implemented through `NewAdminRepository`, master-db access, and `admin_collection_*` tables. `api-tenant` currently boots only the tenant profile module and exposes only profile routes.
- doc_confirmed_facts: The canonical module doc and runtime contract both say collection-table is still an app-local proving surface, package promotion is not yet approved, and a second real consumer is required before extraction.
- inferred_facts: Frontend readiness is partial: the contract layer and tests are strong, but package extraction would currently pull admin-specific transport, route behavior, wording, and styling pressure with it. Backend readiness is partial: the generic helper library is real and tested, but there is no full shared service contract spanning both `api-admin` and `api-tenant`.
- assumptions: Readiness here means safe promotion to a shared package/service that can support both admin and tenant consumers without redefining the contract mid-implementation.

## Lane Plan
- lane_plan: mode=RESEARCH_CONTRACT_LOCK; lanes=none; control-only research completed in this run because the current question was readiness, not implementation
- fe_goal:
- fe_allowed_scope:
- fe_likely_files_or_modules:
- fe_locked_constraints:
- fe_required_reads:
- fe_required_checks:
- fe_expected_report_path:
- be_goal:
- be_allowed_scope:
- be_likely_files_or_modules:
- be_locked_constraints:
- be_required_reads:
- be_required_checks:
- be_expected_report_path:

## Prompt Delivery
- prompt_delivery_status: delivered
- frontend_launch_prompt_path:
- backend_launch_prompt_path:
- direct_launch_prompt_required: no
- prompt_delivery_notes: No FE or BE lane prompt was emitted because the route stayed CONTROL_ONLY until the contract gap is resolved.

## Memory and Risk
- memory_sources_read: platform/AGENTS.md; platform/docs/ai/README.md; platform/docs/ai/current-state.md; platform/docs/ai/canonical-docs.md; platform/docs/ai/modules/collection-table.md; platform/docs/ai/modules/admin-module-registry.md; platform/frontend/AGENTS.md; platform/backend/AGENTS.md; frontend collection-table docs and admin proving-surface code; backend shared collectiontable/collectionprefs code and api-admin/api-tenant wiring.
- memory_update_targets: current-state.md | decisions-log.md | relevant modules/*.md | canonical-docs.md if authority changed
- approvals_required: Owner approval is required before package extraction, tenant rollout, or durable shared-memory updates.
- risks: Frontend has no second real consumer and still depends on admin-local transport, route handlers, wording, and styling. Backend preferences and active routes are admin-only, and `api-tenant` has no collection-table wiring. There is doc/code drift: the working runtime contract describes broader row-action and export behavior than the current admin module-registry implementation exposes.

## Control Progress
- next_control_step: If the owner wants to move forward, open a follow-up contract-hardening run that locks one host-neutral frontend adapter/surface API and one tenant-safe backend service/prefs strategy before any extraction work starts.
- checkpoint_notes: Verdict: frontend is not yet package-ready for admin + tenant use; backend shared helpers are reusable, but the backend is not yet a full shared service for both `api-admin` and `api-tenant`.

## Final Closeout
- final_status: closed
- shared_memory_updates_applied: deferred; this run produced a research verdict only and did not change durable product state
- unresolved_items: second real frontend consumer; approved package target/path; host-neutral toolbar/surface boundary; tenant-capable route family; tenant collection preferences persistence strategy; doc/code alignment for row actions and export behavior
- archive_recommendation: keep as reference for the next follow-up run, then archive after implementation routing is chosen
