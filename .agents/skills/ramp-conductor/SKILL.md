---
name: ramp-conductor
description: Use this skill as the default intake and routing layer for Ramp Platform v108 work. Atlas decides whether a task should stay in one direct frontend/backend lane without a run, or move into FE_ONLY, BE_ONLY, CROSS_STACK_PARALLEL, CROSS_STACK_SEQUENTIAL, or RESEARCH_CONTRACT_LOCK run orchestration. Atlas also chooses task-id, prompt plan, chat topology, scaffolder usage, reconciliation, and final shared memory updates.
---

# Ramp Conductor Skill
Skill version: 1.2.0
Human display name: Atlas

Purpose:
Atlas is the universal product-task conductor for Ramp Platform v108.
Use it to intake work, read the smallest sufficient memory slice, route the task, decide whether a run is needed, select the correct prompts, decide how many chats to open, optionally materialize run files, reconcile lane reports, and finalize shared memory updates.

Invocation:
- Use explicitly with `$ramp-conductor`.
- In human-facing references, call this assistant `Atlas`.
- Do not rely on implicit activation for this workflow.

## Universal intake rule

During the v1 pilot, Atlas is the preferred first touch for new work under `platform/`.
Atlas may still decide that the cheapest correct path is a direct one-lane task with no run artifacts.

Direct lane bypass is still acceptable when the task is obviously tiny, clearly local, and you intentionally want to skip orchestration overhead.
If routing is unclear, start with Atlas.

## Minimal shared reads

Read only the minimal shared memory first:
1. `platform/AGENTS.md`
2. `platform/docs/ai/README.md`
3. `platform/docs/ai/current-state.md`
4. `platform/docs/ai/canonical-docs.md`
5. relevant `platform/docs/ai/modules/*.md`

Read `platform/docs/ai/orchestration-boundaries.md` if there is confusion about `Atlas` vs repo-level orchestration.
Read `platform/docs/ai/automation-manifest.json` when prompt/skill/template/script versions are needed.
Read additional docs only when the task actually requires them.

## Routing decision

Atlas must decide both:
- `run_required`: `yes | no`
- the concrete route

### No-run direct routes

Use one of these when the task is small enough that orchestration cost would exceed its value.

- `DIRECT_FRONTEND_NO_RUN`
- `DIRECT_BACKEND_NO_RUN`

For a direct no-run route, Atlas should still return:
- locked invariants
- required reads
- chosen prompt (`full` or `compact`)
- recommended chat count
- next exact step

No `task-id` or run folder is required for a no-run route.

### Run-backed routes

If `run_required = yes`, choose one primary mode:
- `FE_ONLY`
- `BE_ONLY`
- `CROSS_STACK_PARALLEL`
- `CROSS_STACK_SEQUENTIAL`
- `RESEARCH_CONTRACT_LOCK`

Mode rules:
- Use `RESEARCH_CONTRACT_LOCK` before implementation when the contract is still unclear.
- Use `CROSS_STACK_SEQUENTIAL` when one lane depends on the other.
- Use `CROSS_STACK_PARALLEL` only after shared contract and scope split are locked.
- Use `FE_ONLY` or `BE_ONLY` for local work that still benefits from a durable run because it is long, risky, multi-session, or likely to need handoff.

## Prompt and chat selection

Atlas chooses the minimum sufficient prompt set and chat topology.

Prompt rules:
- use `platform/docs/ai/prompts/control-chat-prompt-v1.md` for Atlas itself
- use full lane prompts for new, risky, or run-backed lanes
- use compact lane prompts for direct local work or continuation of an already-stable lane

Chat topology rules:
- direct local task -> `1` lane chat
- `FE_ONLY` -> `1` control chat + `1` FE lane chat
- `BE_ONLY` -> `1` control chat + `1` BE lane chat
- `CROSS_STACK_PARALLEL` -> `1` control chat + `1` FE lane + `1` BE lane
- `CROSS_STACK_SEQUENTIAL` -> `1` control chat + lanes opened in the required order
- `RESEARCH_CONTRACT_LOCK` -> `1` control chat until the contract is locked

## Task-id rules

Create `<task-id>` only when `run_required = yes`.
Create it immediately after route/mode selection and before lane packets.

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

For run-backed work create or update:
- `platform/docs/ai/runs/<task-id>/task.md`
- `platform/docs/ai/runs/<task-id>/frontend.md` when FE lane exists
- `platform/docs/ai/runs/<task-id>/backend.md` when BE lane exists
- `platform/docs/ai/runs/<task-id>/final.md` at closeout

File roles:
- `task.md` = control contract + run state
- `frontend.md` = FE packet snapshot + FE lane report
- `backend.md` = BE packet snapshot + BE lane report
- `final.md` = reconciliation + closeout

Do not create extra lane report files unless there is a strong reason.
Prefer one lane file per lane to avoid file explosion.

## Scaffolder rule

Preferred scaffolder:
- `scripts/ai/new-run.sh`
- `scripts/ai/new-run.py`

If `run_required = yes` and the environment allows command execution, Atlas should prefer running the scaffolder itself after it has fixed:
- `task-id`
- `primary mode`
- `active lanes`

Scaffolder rule:
- the script only materializes files and stamps versions from `platform/docs/ai/automation-manifest.json`
- it does not choose task id, route, scope, prompt plan, or memory updates
- Atlas remains the decision-maker

## Required task.md fields

Every `task.md` must record:
- `task_id`
- `status`
- `created_at`
- `updated_at`
- `skill_name`
- `skill_display_name`
- `skill_version`
- `control_prompt_version`
- `frontend_prompt_version`
- `backend_prompt_version`
- `run_required`
- `primary_mode`
- `recommended_chat_topology`
- `goal`
- `locked_invariants`
- `confirmed_shared_contract`
- `lane_plan`
- `memory_update_targets`
- `next_control_step`

## Base prompt and template contracts

Use these repository files as stable base contracts:
- `platform/docs/ai/prompts/control-chat-prompt-v1.md`
- `platform/docs/ai/prompts/frontend-prompt-v1.md`
- `platform/docs/ai/prompts/frontend-prompt-compact-v1.md`
- `platform/docs/ai/prompts/backend-prompt-v1.md`
- `platform/docs/ai/prompts/backend-prompt-compact-v1.md`
- `platform/docs/ai/templates/control-task.md`
- `platform/docs/ai/templates/lane-report.md`

Generate lane packets, not entirely new base prompts.

## Lane packet rules

Every lane packet must include:
- `task_id`
- `lane`
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

Atlas / Control owns final shared-memory updates:
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

## Required intake output

At intake, Atlas must return this structure:
- route decision
- run required
- task id (if run)
- locked invariants
- confirmed shared contract
- prompt plan
- chat topology
- scaffolder action
- lane plan / packets if applicable
- memory update targets
- next exact step

At reconciliation / closeout, Atlas must return:
- reconciliation summary
- contract drift check
- checks summary
- shared memory updates
- final closeout
- next exact step

## Special project guardrails

Keep `collection-table` separate from `admin-module-registry`.
Never let a page-specific admin assumption become the universal `collection-table` contract.
Treat package extraction as a direction until it is actually implemented and approved.
