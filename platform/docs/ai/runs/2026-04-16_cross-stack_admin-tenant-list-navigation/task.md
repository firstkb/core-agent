---
template_id: control-task
template_version: 1.3.0
status: active
owner: ramp-platform-v108
last_updated: 2026-04-05
---

# CONTROL TASK

## Metadata
- task_id: 2026-04-16_cross-stack_admin-tenant-list-navigation
- title: [cross-stack] Admin Tenant List Navigation
- status: draft
- created_at: 2026-04-16 12:02:46 -0400
- updated_at: 2026-04-16 12:02:46 -0400
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
- run_artifact_scope: platform/docs/ai/runs/2026-04-16_cross-stack_admin-tenant-list-navigation/

## Goal
- goal: Expose the tenant list section in root admin navigation and wire /admin/tenants to the existing tenant operations surface without expanding non-root rollout.
- why_now: Module registry activation currently enables tenant sections, but root sidebar hides List of tenants because navigation coverage and frontend route wiring are out of sync.
- business_or_technical_value:

## Scope
- in_scope:
- out_of_scope:

## Locked Invariants
- locked_invariants:

## Confirmed Shared Contract
- confirmed_shared_contract:

## Facts and Assumptions
- code_confirmed_facts:
- doc_confirmed_facts:
- inferred_facts:
- assumptions:

## Lane Plan
- lane_plan: mode=CROSS_STACK_SEQUENTIAL; lanes=frontend, backend
- fe_goal:
- fe_allowed_scope:
- fe_likely_files_or_modules:
- fe_locked_constraints:
- fe_required_reads:
- fe_required_checks:
- fe_expected_report_path: platform/docs/ai/runs/2026-04-16_cross-stack_admin-tenant-list-navigation/frontend.md
- be_goal:
- be_allowed_scope:
- be_likely_files_or_modules:
- be_locked_constraints:
- be_required_reads:
- be_required_checks:
- be_expected_report_path: platform/docs/ai/runs/2026-04-16_cross-stack_admin-tenant-list-navigation/backend.md

## Prompt Delivery
- prompt_delivery_status: pending
- frontend_launch_prompt_path: platform/docs/ai/runs/2026-04-16_cross-stack_admin-tenant-list-navigation/frontend.md#ready-chat-launch-prompt
- backend_launch_prompt_path: platform/docs/ai/runs/2026-04-16_cross-stack_admin-tenant-list-navigation/backend.md#ready-chat-launch-prompt
- direct_launch_prompt_required: no
- prompt_delivery_notes:

## Memory and Risk
- memory_sources_read:
- memory_update_targets: current-state.md | decisions-log.md | relevant modules/*.md | canonical-docs.md if authority changed
- approvals_required:
- risks:

## Control Progress
- next_control_step: Atlas to fill packets, render ready lane prompts, launch the planned lane topology, and reconcile outputs
- checkpoint_notes:

## Final Closeout
- final_status: draft
- shared_memory_updates_applied: not yet
- unresolved_items:
- archive_recommendation: archive only after closeout and inactivity
