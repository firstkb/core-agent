---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: state_model
lang: en
---

# Maestro vNext State Model

## Design Rule

Live operational state belongs in the Maestro API/DB. Artifact JSON files are
portable snapshots or handoffs.

All mutable state changes must pass through typed transitions.

## Primary Entities

- workspace
- repository
- work
- feature
- task
- task_dependency
- stage
- attempt
- evidence
- approval
- agent_role
- agent_run
- run_event
- comment
- external_link

## Entity Hierarchy

Phase 1 uses one implicit current workspace/repository for the repo.

```text
workspace / repository
  -> work
    -> feature
      -> task
        -> stage
          -> attempt
            -> evidence
```

`work` is the owner-request container for any size of request: tiny direct
change, bounded task, feature, module-sized initiative, or high-risk operation.

`feature` is a decomposition slice inside work. Small work may skip features and
attach tasks directly to work.

## Work Type

Recommended work types:

- `direct`
- `task`
- `feature`
- `module_sized_work`
- `high_risk`

## Work Status

Recommended work statuses:

- `draft`
- `ready`
- `awaiting_approval`
- `in_progress`
- `awaiting_review`
- `blocked`
- `done`
- `cancelled`

Rules:

- `direct` work may skip persisted stages and close with concise evidence;
- `task` work should use the lightweight artifact shape unless stage attempts
  are needed;
- `feature` work should create feature artifacts only when real decomposition is
  useful;
- `module_sized_work` requires a work brief before execution approval;
- `high_risk` work requires explicit approval gates before implementation or
  release.

## Task Status

Recommended task statuses:

- `draft`
- `ready`
- `blocked`
- `awaiting_approval`
- `in_progress`
- `awaiting_review`
- `revise_requested`
- `verified`
- `done`
- `cancelled`

Rules:

- high-risk tasks cannot move from `ready` to `in_progress` without required
  approvals;
- tasks with unmet dependencies cannot move to `ready`;
- `done` requires required evidence and accepted review when review is required.

## Stage Status

Detailed pause, resume, cancel, checkpoint, and stale semantics live in
`run-control-contract.md`.

Recommended stage statuses:

- `pending`
- `ready`
- `in_progress`
- `pause_requested`
- `paused`
- `resume_requested`
- `awaiting_review`
- `accepted`
- `revise_requested`
- `cancel_requested`
- `failed`
- `cancelled`
- `stale`

Rules:

- at most one active attempt per stage in the first cut;
- a submitted handoff moves a stage to `awaiting_review`;
- review decisions are explicit and do not silently start the next stage.

## Attempt Status

Recommended attempt statuses:

- `created`
- `running`
- `pause_requested`
- `paused`
- `resume_requested`
- `submitted`
- `accepted`
- `rejected`
- `cancel_requested`
- `failed`
- `cancelled`
- `stale`

Rules:

- attempts are append-only;
- retry creates a new attempt id;
- attempt evidence remains attached to the attempt that produced it.

## Approval Status

Recommended approval statuses:

- `requested`
- `approved`
- `rejected`
- `cancelled`
- `expired`

Approval types:

- `brief`
- `execution`
- `high_risk_implementation`
- `release`
- `security`
- `migration`
- `memory_update`

## Transition Commands

Prefer command endpoints over arbitrary status patches.

Examples:

```text
POST /api/tasks/:id/transition
POST /api/stages/:id/start
POST /api/stages/:id/submit-handoff
POST /api/stages/:id/review
POST /api/approvals/:id/request
POST /api/approvals/:id/decide
```

Canonical API mutations use `POST` command endpoints. `PATCH /status` is not
part of the target API.

## Audit Log

Every state transition should append a `run_event` with:

- actor;
- command;
- previous state;
- next state;
- timestamp;
- evidence or approval references when relevant.

The audit log is not a substitute for first-class state. It is the history.
