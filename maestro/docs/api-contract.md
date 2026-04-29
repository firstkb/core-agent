---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: api_contract
lang: en
---

# Maestro Cockpit API Contract

## Purpose

The Maestro Cockpit API is the proposed stateless control-plane API for Maestro
vNext.

The API owns live operational state through the database. Artifact files under
`maestro/artifacts/` are portable snapshots, evidence, and handoffs, not the
primary mutable state.

## Design Rules

- Prefer command endpoints for lifecycle transitions.
- Do not expose arbitrary status patches that bypass gates.
- Do not use `PATCH` as a canonical mutation method. Use `POST` command
  endpoints so each mutation has a command name, actor, reason, gate checks, and
  audit event.
- Record every state transition as a run event.
- Keep API stateless; do not resume work from process memory.
- Store artifacts separately from live state.
- Scope agent permissions per run, task, stage, and repository checkout.
- Phase 1 assumes one implicit current workspace/repository for the repo.

## Core Resource Endpoints

Workspace and repository:

```text
GET /api/workspace
GET /api/repository
```

Work:

```text
GET  /api/work?status=&type=&riskLevel=&owner=
POST /api/work
GET  /api/work/:id
POST /api/work/:id/update
```

Features:

```text
GET  /api/features?workId=&status=
POST /api/features
GET  /api/features/:id
POST /api/features/:id/update
```

Tasks:

```text
GET  /api/tasks?workId=&featureId=&status=&lane=&riskLevel=
POST /api/tasks
GET  /api/tasks/:id
POST /api/tasks/:id/update
```

Task dependencies:

```text
POST /api/tasks/:id/dependencies/add
POST /api/tasks/:id/dependencies/remove
```

Stages:

```text
GET  /api/tasks/:id/stages
POST /api/tasks/:id/stages
GET  /api/stages/:id
```

Attempts:

```text
GET  /api/tasks/:id/attempts
POST /api/tasks/:id/attempts
GET  /api/attempts/:id
```

Evidence:

```text
GET  /api/tasks/:id/evidence
POST /api/tasks/:id/evidence
GET  /api/attempts/:id/evidence
POST /api/attempts/:id/evidence
```

Approvals:

```text
GET  /api/tasks/:id/approvals
POST /api/tasks/:id/approvals
GET  /api/approvals/:id
```

Agents:

```text
GET /api/agents
GET /api/agent-capabilities
```

Events, comments, and links:

```text
GET  /api/run-events?taskId=&stageId=&attemptId=
POST /api/comments
POST /api/external-links
```

Artifacts:

```text
POST /api/artifacts/import
POST /api/artifacts/export
POST /api/artifacts/validate
```

Packet generation:

```text
POST /api/task-packets/generate
POST /api/stage-packets/generate
```

## Lifecycle Command Endpoints

Work:

```text
POST /api/work/:id/transition
```

Allowed work transition commands:

- `mark_ready`
- `request_approval`
- `approve_execution`
- `start`
- `block`
- `unblock`
- `complete`
- `cancel`

Tasks:

```text
POST /api/tasks/:id/transition
```

Allowed task transition commands:

- `mark_ready`
- `block`
- `unblock`
- `request_approval`
- `start`
- `request_revision`
- `mark_verified`
- `complete`
- `cancel`

Stages:

```text
POST /api/stages/:id/start
POST /api/stages/:id/pause
POST /api/stages/:id/resume
POST /api/stages/:id/cancel
POST /api/stages/:id/submit-handoff
POST /api/stages/:id/review
```

Approvals:

```text
POST /api/approvals/:id/request
POST /api/approvals/:id/decide
```

Agent runs:

```text
POST /api/agent-runs
POST /api/agent-runs/:id/start
POST /api/agent-runs/:id/cancel
POST /api/agent-runs/:id/submit
```

## Minimum Request Shapes

Task transition:

```json
{
  "command": "start",
  "reason": "Execution approval is present and dependencies are satisfied.",
  "actor": {
    "type": "owner",
    "id": "owner"
  }
}
```

Stage review:

```json
{
  "decision": "accept",
  "reason": "Verification evidence satisfies the task acceptance signals.",
  "next_stage": "closeout"
}
```

Approval decision:

```json
{
  "decision": "approved",
  "reason": "High-risk implementation scope is accepted.",
  "decided_by": "owner"
}
```

Update command:

```json
{
  "changes": {
    "title": "Add AI chat work",
    "priority": "high"
  },
  "reason": "Owner clarified the desired scope.",
  "actor": {
    "type": "owner",
    "id": "owner"
  }
}
```

Dependency remove:

```json
{
  "dependency_id": "task-design-chat-api",
  "reason": "The dependency was merged into this task.",
  "actor": {
    "type": "maestro",
    "id": "maestro"
  }
}
```

## Cloud Readiness

The API is designed so a future worker can:

- pull work from a queue;
- create a fresh repo checkout per run;
- attach artifacts and evidence to an attempt;
- submit a handoff;
- stop without losing state;
- resume from DB state and artifacts, not process memory.

## Agent Access

Agents should not use raw API calls as their primary interface in Phase 1.

Preferred path:

```text
Codex/local agent -> maestroctl -> Maestro API -> DB/artifacts
```

The API remains the canonical service boundary. `maestroctl` is the local driver
that stabilizes auth, workspace discovery, artifact paths, schema validation,
idempotency keys, and JSON output for agents.
