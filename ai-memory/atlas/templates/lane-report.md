---
template_id: lane-report
template_version: 1.3.1
status: active
owner: ramp-platform-v108
last_updated: 2026-04-26
---

# LANE FILE

Use this template for run-backed FE/BE lanes.
Do not create a lane file for direct no-run work.
Owner-requested `MANUAL_HANDOFF_NO_RUN` uses a chat prompt and compact Agent
Evidence, not this persistent lane artifact.

## Metadata
- task_id:
- lane: frontend | backend
- status: active | blocked | done
- report_time:
- prompt_version:
- control_prompt_version:
- author:

## Launch Metadata
- base_prompt_file:
- base_prompt_version:
- prompt_variant: full | compact
- launch_prompt_status: pending | ready | used

## Ready Chat Launch Prompt
```text
Atlas must replace this stub with a ready-to-paste lane launch prompt before the lane chat is opened.
```

## Control Packet Snapshot
- assigned_goal:
- why_now:
- allowed_scope:
- likely_files_or_modules:
- locked_constraints:
- out_of_scope:
- required_reads:
- required_checks:
- expected_report_path:
- memory_delta_expectation:

## Analysis Snapshot
- locked_invariants:
- confirmed_facts:
- assumptions:
- change_classification:

## Lane Return Report
- touched_files:
- summary_of_changes:
- checks_run:
- checks_still_needed:
- blockers:
- unresolved_risks:
- contract_drift: yes | no
- proposed_memory_deltas:
- next_lane_step:

## Reconciliation Readiness
- ready_for_reconciliation: no
- ready_for_closeout: no
- recommended_next_control_action:
