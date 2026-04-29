---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: db_model
lang: en
---

# Maestro vNext DB Model

## Purpose

This document defines the proposed minimum database model for Maestro Cockpit.

The database owns live operational state. Artifacts under `maestro/artifacts/`
are portable records, handoffs, evidence, and snapshots.

## Design Rules

- Phase 1 uses one implicit current workspace/repository.
- Do not introduce `projects` or `modules` as core tables.
- Use `work` as the owner-request container.
- Store lifecycle state in DB, not hand-edited JSON.
- Record every state transition in `run_events`.
- Keep snapshots as exports, not source of truth.
- Keep low-risk local work possible without forcing full artifact trees.

## Entity Hierarchy

```text
workspace / repository
  -> work
    -> feature
      -> task
        -> stage
          -> attempt
            -> evidence
```

Small work may skip `feature` and attach tasks directly to `work`.

## Tables

## `workspace`

Purpose:

- singleton current workspace for Phase 1.

Core fields:

- `id`
- `name`
- `root_path`
- `created_at`
- `updated_at`

## `repository`

Purpose:

- repo identity and current local/cloud checkout context.

Core fields:

- `id`
- `workspace_id`
- `name`
- `root_path`
- `remote_url`
- `default_branch`
- `created_at`
- `updated_at`

## `work`

Purpose:

- owner-request container for any size of work.

Core fields:

- `id`
- `repository_id`
- `title`
- `description`
- `type`
- `status`
- `artifact_shape`
- `risk_level`
- `priority`
- `owner`
- `branch`
- `pr_url`
- `artifact_root`
- `created_at`
- `updated_at`

Allowed `type` values:

- `direct`
- `task`
- `feature`
- `module_sized_work`
- `high_risk`

Allowed `artifact_shape` values:

- `none`
- `lightweight`
- `staged_task`
- `feature_work`
- `full`

## `features`

Purpose:

- decomposition slice inside a work item.

Core fields:

- `id`
- `work_id`
- `title`
- `description`
- `status`
- `sequence`
- `priority`
- `artifact_path`
- `created_at`
- `updated_at`

Rules:

- only create features when decomposition is useful;
- sequence preserves approved feature order.

## `tasks`

Purpose:

- executable unit assigned to an agent or lane.

Core fields:

- `id`
- `work_id`
- `feature_id`
- `title`
- `description`
- `status`
- `lane`
- `stack_scope`
- `risk_level`
- `priority`
- `assignee_type`
- `agent_role`
- `branch`
- `pr_url`
- `ci_status`
- `visual_status`
- `artifact_path`
- `created_at`
- `updated_at`

Rules:

- `feature_id` may be null for direct work-to-task execution;
- high-risk tasks require approval before implementation.

## `task_dependencies`

Purpose:

- dependency graph between tasks.

Core fields:

- `id`
- `task_id`
- `dependency_task_id`
- `dependency_type`
- `created_at`

Rules:

- a task cannot become `ready` while blocking dependencies are incomplete.

## `stages`

Purpose:

- lifecycle step for a task.

Core fields:

- `id`
- `task_id`
- `name`
- `status`
- `sequence`
- `agent_role`
- `checkpoint_policy`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Rules:

- stages are created only when useful;
- no automatic stage chaining without Maestro decision.

## `attempts`

Purpose:

- one execution try for one stage.

Core fields:

- `id`
- `task_id`
- `stage_id`
- `attempt_no`
- `agent_role`
- `agent_run_id`
- `status`
- `summary`
- `handoff_path`
- `readme_path`
- `files_changed_json`
- `commands_run_json`
- `evidence_json`
- `created_at`
- `submitted_at`

Rules:

- attempts are append-only;
- retry creates a new attempt row;
- at most one active attempt per stage in Phase 1.

## `evidence`

Purpose:

- evidence attached to a work item, task, stage, or attempt.

Core fields:

- `id`
- `work_id`
- `task_id`
- `stage_id`
- `attempt_id`
- `type`
- `title`
- `uri`
- `metadata_json`
- `created_at`

Rules:

- evidence should point to files, URLs, or external systems;
- large logs live as files, not inline DB payloads.

## `approvals`

Purpose:

- explicit approval gates and decisions.

Core fields:

- `id`
- `work_id`
- `task_id`
- `approval_type`
- `status`
- `requested_by`
- `approved_by`
- `reason`
- `created_at`
- `decided_at`

Allowed approval types:

- `brief`
- `execution`
- `high_risk_implementation`
- `security`
- `migration`
- `release`
- `memory_update`

## `agent_roles`

Purpose:

- registry of available Maestro roles.

Core fields:

- `id`
- `name`
- `description`
- `can_write_code`
- `allowed_stages_json`
- `created_at`
- `updated_at`

## `agent_runs`

Purpose:

- one specialist invocation or local/manual execution record.

Core fields:

- `id`
- `work_id`
- `task_id`
- `stage_id`
- `attempt_id`
- `agent_role`
- `status`
- `started_at`
- `completed_at`
- `metadata_json`

## `run_events`

Purpose:

- append-only audit log of state transitions and important actions.

Core fields:

- `id`
- `work_id`
- `task_id`
- `stage_id`
- `attempt_id`
- `actor_type`
- `actor_id`
- `command`
- `previous_state_json`
- `next_state_json`
- `reason`
- `created_at`

Rules:

- every transition writes a run event;
- run events are history, not the only source of current state.

## `comments`

Purpose:

- owner, Maestro, or reviewer discussion attached to work.

Core fields:

- `id`
- `work_id`
- `task_id`
- `author_type`
- `author_id`
- `body`
- `created_at`

## `external_links`

Purpose:

- links to PRs, CI runs, dashboards, tickets, releases, and external evidence.

Core fields:

- `id`
- `work_id`
- `task_id`
- `type`
- `title`
- `url`
- `metadata_json`
- `created_at`

## Indexes And Constraints

Recommended unique constraints:

- `workspace.id`
- `repository.id`
- `work.id`
- `features.id`
- `tasks.id`
- `(task_dependencies.task_id, task_dependencies.dependency_task_id)`
- `(stages.task_id, stages.name, stages.sequence)`
- `(attempts.stage_id, attempts.attempt_no)`

Recommended indexes:

- `work.status`
- `work.type`
- `work.risk_level`
- `features.work_id`
- `tasks.work_id`
- `tasks.feature_id`
- `tasks.status`
- `stages.task_id`
- `stages.status`
- `attempts.stage_id`
- `evidence.task_id`
- `evidence.attempt_id`
- `approvals.work_id`
- `approvals.task_id`
- `run_events.work_id`

## Non-Goals For Phase 1

- multi-repository project portfolio management;
- parallel active attempts for one stage;
- production worker queue tables beyond `agent_runs`;
- storing large logs directly in DB;
- using artifact snapshots as live state.
