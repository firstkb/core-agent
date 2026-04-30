---
template_id: control-task
template_version: 1.3.1
status: active
owner: vsm-v1.0.0
last_updated: 2026-04-28
---

# CONTROL TASK

## Metadata
- task_id:
- title:
- status: draft | active | blocked | reconciled | closed | superseded
- created_at:
- updated_at:
- created_by:
- skill_name:
- skill_display_name:
- skill_version:
- control_prompt_version:
- frontend_prompt_version:
- backend_prompt_version:

## Routing Decision
- run_required: yes
- primary_mode: FE_ONLY | BE_ONLY | CROSS_STACK_PARALLEL | CROSS_STACK_SEQUENTIAL | RESEARCH_CONTRACT_LOCK
- recommended_chat_topology: CONTROL_ONLY | CONTROL_PLUS_FE | CONTROL_PLUS_BE | CONTROL_PLUS_FE_AND_BE
- active_lanes:
- execution_order:
- scaffolder_action:
- run_artifact_scope:

## Goal
- goal:
- why_now:
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
- lane_plan:
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
- prompt_delivery_status: pending | ready | delivered
- frontend_launch_prompt_path:
- backend_launch_prompt_path:
- direct_launch_prompt_required:
- prompt_delivery_notes:

## Memory and Risk
- memory_sources_read:
- memory_update_targets:
- approvals_required:
- risks:

## Control Progress
- next_control_step:
- checkpoint_notes:

## Final Closeout
- final_status:
- shared_memory_updates_applied:
- unresolved_items:
- archive_recommendation:
