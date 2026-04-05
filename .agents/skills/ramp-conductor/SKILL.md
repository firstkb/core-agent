---
name: ramp-conductor
description: Use this skill to orchestrate non-trivial Ramp Platform v108 work: task intake, mode selection, task-id creation, run setup, FE/BE lane packet generation, report reconciliation, and final shared memory updates. Trigger for cross-stack, multi-session, contract-sensitive, auth/session, tenancy, package-boundary, or high-risk work. Do not use for tiny single-lane edits.
---

# Ramp Conductor Skill
Skill version: 1.0.0
Human display name: Atlas

Purpose:
This skill is the manual control-plane orchestrator for Ramp Platform v108.
It owns intake, mode selection, run setup, lane packet generation, reconciliation, and final shared memory updates.

Invocation:
- Use explicitly with `$ramp-conductor`.
- In human-facing references, call this assistant `Atlas`.
- Do not rely on implicit activation for this workflow.

Use this skill when:
- work is cross-stack
- shared contract may change
- auth/session or tenancy risk exists
- package extraction or boundary work is involved
- the task likely needs FE and BE lanes
- the task is multi-session, checkpoint-heavy, or handoff-heavy

Do not use this skill when:
- the task is clearly local to one lane
- the change is tiny and does not affect shared memory or shared contract
- orchestration overhead would be higher than implementation cost

## Minimal shared reads

Read only the minimal shared memory first:
1. `platform/AGENTS.md`
2. `platform/docs/ai/README.md`
3. `platform/docs/ai/current-state.md`
4. `platform/docs/ai/canonical-docs.md`
5. relevant `platform/docs/ai/modules/*.md`

Read additional docs only when the task actually requires them.

## Primary mode selection

Choose one primary mode before creating lane packets:
- `FE_ONLY`
- `BE_ONLY`
- `CROSS_STACK_PARALLEL`
- `CROSS_STACK_SEQUENTIAL`
- `RESEARCH_CONTRACT_LOCK`

Mode rule:
- Use `RESEARCH_CONTRACT_LOCK` before implementation when the contract is still unclear.
- Use `CROSS_STACK_SEQUENTIAL` when one lane depends on the other.
- Use `CROSS_STACK_PARALLEL` only after shared contract and scope split are locked.

## Task-id rules

Create `<task-id>` immediately after mode selection and before lane packets.

Format:
`YYYY-MM-DD_<scope>_<short-kebab-purpose>`

Scope values:
- `frontend`
- `backend`
- `cross-stack`
- `research`
- `module-collection-table`
- `module-admin-module-registry`

Rules:
- use lowercase ASCII only
- use hyphen-separated slug words
- do not include timestamps by default
- keep the slug short but specific
- append `-02`, `-03`, ... only when a same-day collision already exists

Examples:
- `2026-04-05_cross-stack_collection-table-package-readiness`
- `2026-04-05_backend_admin-nav-permissions`
- `2026-04-05_frontend_auth-bootstrap-guard-fix`

Lifecycle rule:
- reuse the same `task-id` across sessions while the same engineering objective remains active
- create a new `task-id` only when the objective, boundary, or acceptance target materially changes

## Run artifacts

For non-trivial work create or update:
- `platform/docs/ai/runs/<task-id>/task.md`
- `platform/docs/ai/runs/<task-id>/frontend.md` when FE lane exists
- `platform/docs/ai/runs/<task-id>/backend.md` when BE lane exists
- `platform/docs/ai/runs/<task-id>/final.md` at closeout

File roles:
- `task.md` = control contract + run state
- `frontend.md` = FE lane packet snapshot + FE lane report
- `backend.md` = BE lane packet snapshot + BE lane report
- `final.md` = reconciliation + closeout

Do not create extra lane report files unless there is a strong reason.
Prefer one lane file per lane to avoid file explosion.

## Optional scaffolder

After Control has chosen the task id, mode, and active lanes, prefer the repo scaffolder when available:
- `scripts/ai/new-run.sh`
- `scripts/ai/new-run.py`

Scaffolder rule:
- the script only materializes files and stamps versions
- it does not choose task id, mode, scope, or memory updates
- Atlas / Control remains the decision-maker

## Required task.md header fields

Every `task.md` must record:
- `task_id`
- `status`: `draft | active | blocked | reconciled | closed | superseded`
- `created_at`
- `updated_at`
- `mode`
- `control_prompt_version`
- `frontend_prompt_version`
- `backend_prompt_version`
- `skill_version`
- `goal`
- `locked_invariants`
- `confirmed_shared_contract`
- `lane_plan`
- `out_of_scope`
- `memory_update_targets`
- `next_control_step`

## Base prompt and template contracts

Use these repository files as stable base contracts:
- `platform/docs/ai/prompts/control-chat-prompt-v1.md`
- `platform/docs/ai/prompts/frontend-prompt-v1.md`
- `platform/docs/ai/prompts/backend-prompt-v1.md`
- `platform/docs/ai/templates/control-task.md`
- `platform/docs/ai/templates/lane-report.md`

Generate lane packets, not entirely new base prompts.

## Lane packet rules

Every lane packet must include:
- `task_id`
- `lane`: `frontend` or `backend`
- `goal`
- `allowed_scope`
- `likely_files_or_modules`
- `locked_constraints`
- `out_of_scope`
- `required_reads`
- `required_checks`
- `expected_report_format`

Lane rule:
- FE and BE lanes implement only local scope
- FE and BE lanes may propose shared-memory deltas
- FE and BE lanes do not finalize shared-memory updates

## Lane report rules

Each lane must return:
- `task_id`
- `lane`
- `status`: `active | blocked | done`
- `touched_files`
- `summary_of_changes`
- `checks_run`
- `checks_still_needed`
- `blockers`
- `unresolved_risks`
- `contract_drift`: `yes/no`
- `proposed_memory_deltas`
- `next_lane_step`

Checkpoint rule:
- use repo checkpoints only for meaningful progress, blockers, or handoff
- do not log every micro-step into run files

## Reconciliation rules

After receiving lane reports:
1. compare FE and BE against the locked shared contract
2. check for contract drift or scope drift
3. issue a correction packet if reconciliation fails
4. update shared memory only after reconciliation
5. write `final.md`
6. record the next exact step or close the run

## Shared memory ownership

Control owns final shared-memory updates:
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/decisions-log.md`
- `platform/docs/ai/modules/*.md`
- `platform/docs/ai/canonical-docs.md` when authority changes

FE and BE lanes may propose deltas only.

## Closeout rules

A run may be closed only when:
- lane work is reconciled
- shared-memory updates are applied or explicitly deferred
- final risks are recorded
- the next exact step is written, or the task is marked complete

Closed runs are historical execution artifacts, not canonical memory.
Move closed or superseded runs out of `platform/docs/ai/runs/` once they stop being part of active work.

## Special project guardrails

Keep `collection-table` separate from `admin-module-registry`.
Never let a page-specific admin assumption become the universal `collection-table` contract.
Treat package extraction as a direction until it is actually implemented and approved.
