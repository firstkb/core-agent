---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: phase_1_implementation_brief
lang: en
---

# Maestro Phase 1 Implementation Brief

## Purpose

This brief turns the Maestro vNext contracts into the first implementation
slice. It defines what to build first, which stack to use, and what remains out
of scope.

Phase 1 should produce a local Maestro Cockpit that manages real operational
state before automated cloud workers or GitHub integration exist.

## Product Rule

Build a useful jet, not a process-heavy aircraft.

Phase 1 must prove the core loop:

```text
owner request -> work/task/stage state -> evidence/approval -> closeout
```

Do not build cloud orchestration, portfolio management, analytics, or automated
agent spawning until the local cockpit loop is working.

## Scope

Phase 1 includes:

- one implicit current workspace and repository;
- PostgreSQL-backed Maestro API;
- local Cockpit UI;
- `maestroctl` local CLI driver;
- local API-owned artifact store;
- Work, Feature, Task, Stage, Attempt, Evidence, Approval, Agent Run, and Run
  Event entities;
- command endpoints for lifecycle transitions;
- compact table, Kanban, drawer, evidence, approval, and agent-run views.

Phase 1 does not include:

- cloud workers;
- automated agent spawning;
- multi-repository portfolio management;
- GitHub PR or CI integration;
- production deployment automation;
- queue leases or worker fleet dashboards;
- complex analytics;
- OpenAPI/code generation unless it clearly speeds up the first slice.

## Technical Decisions

### Backend

Use Go and PostgreSQL.

Directory target:

```text
maestro/backend/
  cmd/api/
  internal/
  migrations/
```

Rules:

- API is stateless.
- DB owns live operational state.
- Use command endpoints for lifecycle changes.
- Record transitions in `run_events`.
- Store artifact paths and metadata in DB, not artifact state.
- Use the existing `platform/backend` as an implementation blueprint, not as a
  direct tenant/product dependency.

PostgreSQL is the Phase 1 DB. Do not add SQLite as a local-only shortcut. The
state model depends on durable transitions, JSON metadata, audit events, and
future worker semantics that map better to PostgreSQL.

Minimum environment:

```text
MAESTRO_DATABASE_URL
MAESTRO_ARTIFACT_ROOT
MAESTRO_HTTP_ADDR
```

### Frontend

Use React, TypeScript, Vite, and pnpm.

Directory target:

```text
maestro/frontend/
  src/
    app/
    api/
    views/
      dashboard/
      work-table/
      kanban/
      task-drawer/
      evidence/
      approvals/
      agent-runs/
    components/
    styles/
```

Recommended dependencies:

- React;
- React Router;
- lucide-react;
- Vite;
- Vitest for focused UI logic tests.

Avoid a heavy UI framework in Phase 1. Cockpit needs compact operational
surfaces: table, Kanban, drawer, filters, status pills, evidence, approvals, and
agent-run state. A small local component layer is enough.

### CLI

`maestroctl` lives inside Maestro.

Directory target:

```text
maestro/cli/
  package.json
  bin/maestroctl
  src/
    maestroctl.mjs
  test/
```

Use a dependency-free Node CLI for the first driver. TypeScript can be added
later with frontend/tooling if it improves maintainability.

Rules:

- CLI talks to Maestro API only.
- CLI does not write DB state directly.
- CLI validates JSON packet and handoff files before submit.
- CLI normalizes repo-relative artifact paths.
- CLI returns stable JSON for agents.

Primary flow:

```text
agent or human -> maestroctl -> Maestro API -> PostgreSQL + artifacts
```

### Artifacts

Artifacts are local files owned by the API, with DB records as the live index.

Default Phase 1 root:

```text
maestro/artifacts/current/
  work/<work_id>/
    brief.md
    task.md
    closeout.md
    stages/<stage_name>/attempt-001/
      README.md
      handoff.json
      evidence/
        screenshots/
        logs/
        reports/
```

Rules:

- DB owns live state.
- Artifacts are portable records, handoffs, evidence, and exports.
- Evidence files are immutable after attachment.
- API writes, imports, exports, and validates artifact paths.
- Agents attach artifacts through `maestroctl` or API.
- Do not use hand-edited artifact JSON as mutable state.

DB should store:

- artifact root;
- artifact URI;
- evidence type;
- attachment target;
- attempt id;
- metadata JSON;
- timestamps.

## First Vertical Slice

Build one end-to-end slice before broadening the system:

1. Create work.
2. Create task under work.
3. Create stages for the task.
4. Start a stage.
5. Create an attempt.
6. Attach evidence.
7. Request and decide approval.
8. Submit handoff.
9. Review stage.
10. Close task.
11. See the state in Cockpit table, Kanban, drawer, evidence, approvals, and
    agent-runs views.

This slice should support T1 Lightweight Task and T2 Staged Task well enough to
run real local work manually through Codex and `maestroctl`.

## Implementation Order

Recommended order:

1. Backend skeleton: config, DB connection, health endpoint, migrations runner.
2. PostgreSQL schema for the Phase 1 entities.
3. API command endpoints for work, tasks, stages, attempts, evidence, approvals,
   agent runs, and run events.
4. Artifact root handling and evidence attachment.
5. `maestroctl` commands for the first vertical slice.
6. Frontend shell with table, Kanban, and detail drawer.
7. Evidence, approvals, and agent-runs panels.
8. Targeted tests and local run docs.

## Execution Checklist

Use this checklist as the Phase 1 control surface unless a separate task file is
created later.

### Backend Foundation

- [x] Create `maestro/backend/` skeleton.
- [x] Add config loading for `MAESTRO_DATABASE_URL`,
  `MAESTRO_ARTIFACT_ROOT`, and `MAESTRO_HTTP_ADDR`.
- [x] Add PostgreSQL connection and health endpoint.
- [x] Add migration runner.
- [x] Add initial migrations for Phase 1 tables.
- [x] Add run event append helper.

### API Slice

- [x] Implement work create/list/get/update endpoints.
- [x] Implement task create/list/get/update endpoints.
- [x] Implement stage create/list/start/pause/resume/cancel endpoints.
- [x] Implement attempt create/submit endpoints.
- [x] Implement evidence attach/list endpoints.
- [x] Implement approval request/decide endpoints.
- [x] Implement agent-run create/start/pause/resume/cancel/checkpoint endpoints.
- [x] Ensure lifecycle commands append `run_events`.
- [x] Ensure high-risk transitions require explicit approval.

### Artifact Slice

- [x] Create `maestro/artifacts/current/` root handling.
- [x] Normalize artifact paths through the API.
- [x] Attach evidence files to attempt/task/work records.
- [x] Write handoff and attempt files without treating them as live state.
- [x] Validate artifact path traversal protection.

### CLI Slice

- [x] Create `maestro/cli/` skeleton.
- [x] Add stable JSON output shape.
- [x] Add `maestroctl work` commands for the vertical slice.
- [x] Add `maestroctl task` commands for the vertical slice.
- [x] Add `maestroctl stage` commands for start, handoff, and review.
- [x] Add `maestroctl evidence attach`.
- [x] Add `maestroctl approval request/decide`.
- [x] Validate packet and handoff JSON before submit.

### Local Integration Smoke

- [x] Add tracked local env example.
- [x] Ignore real local Maestro env files.
- [x] Add Postgres/API/`maestroctl` smoke runner.
- [x] Run smoke against a disposable local PostgreSQL database.
- [x] Verify state persistence after API restart.
- [x] Verify evidence and handoff files exist under the smoke artifact root.
- [x] Verify run events are present for lifecycle transitions.

### Frontend Slice

- [x] Create `maestro/frontend/` skeleton.
- [x] Add API client layer.
- [x] Add Cockpit shell.
- [x] Add work table.
- [x] Add Kanban view.
- [x] Add task detail drawer.
- [x] Add evidence panel.
- [x] Add approval queue.
- [x] Add agent-runs panel.
- [x] Surface current gate, missing evidence, and next allowed action.

### Frontend Control Slice

- [x] Add Cockpit command client methods for stage lifecycle actions.
- [x] Add Cockpit command client methods for approval decisions.
- [x] Add drawer controls for stage start, pause, resume, cancel, and review.
- [x] Add drawer controls for approval approve/reject decisions.
- [x] Refresh task detail and task list after Cockpit commands.

### Frontend Evidence Slice

- [x] Use same-origin `/api` proxy for local Cockpit API calls.
- [x] Add Cockpit command client method for task evidence attachment.
- [x] Add drawer evidence form for URI evidence.
- [x] Add drawer evidence form for text-file artifact attachment.
- [x] Refresh task detail after evidence attachment.

### Frontend Intake Slice

- [x] Add Cockpit command client methods for work, task, and stage creation.
- [x] Add compact intake dialog for work/task/stage creation.
- [x] Create work, task, and optional initial stage in one Cockpit flow.
- [x] Select the new task and refresh drawer state after intake creation.

### Verification

- [x] Backend starts against local PostgreSQL.
- [x] Migrations can run on a clean database.
- [x] State survives backend restart.
- [x] `maestroctl` can complete the first vertical slice.
- [x] Cockpit reads the same state as `maestroctl`.
- [x] Evidence files exist under the configured `maestro/artifacts/` root.
- [x] Run events are present for lifecycle transitions.
- [x] Targeted backend tests pass.
- [x] Targeted CLI tests pass.
- [x] Targeted frontend tests pass.

## Acceptance

Phase 1 is accepted when:

- backend starts against local PostgreSQL;
- DB migrations create the Phase 1 schema;
- `maestroctl` can create work, task, stage, evidence, approval, and handoff
  records through the API;
- Cockpit shows the same state from DB;
- state survives backend restart;
- attached evidence files are present under `maestro/artifacts/current`;
- lifecycle transitions append `run_events`;
- unsupported high-risk actions require explicit approval;
- closeout can show checks, missing checks, approvals, evidence, and residual
  risks.

## First Implementation Commit Target

The first implementation commit should create only the backend skeleton and
initial migration path. It should not attempt to build the full Cockpit in the
same commit.
