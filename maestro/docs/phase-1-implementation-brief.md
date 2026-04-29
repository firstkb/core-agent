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
  src/
    maestroctl.ts
    commands/
```

Use Node/TypeScript for the first CLI driver.

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

- [ ] Create `maestro/artifacts/current/` root handling.
- [ ] Normalize artifact paths through the API.
- [ ] Attach evidence files to attempt/task/work records.
- [ ] Write handoff and attempt files without treating them as live state.
- [ ] Validate artifact path traversal protection.

### CLI Slice

- [ ] Create `maestro/cli/` skeleton.
- [ ] Add stable JSON output shape.
- [ ] Add `maestroctl work` commands for the vertical slice.
- [ ] Add `maestroctl task` commands for the vertical slice.
- [ ] Add `maestroctl stage` commands for start, handoff, and review.
- [ ] Add `maestroctl evidence attach`.
- [ ] Add `maestroctl approval request/decide`.
- [ ] Validate packet and handoff JSON before submit.

### Frontend Slice

- [ ] Create `maestro/frontend/` skeleton.
- [ ] Add API client layer.
- [ ] Add Cockpit shell.
- [ ] Add work table.
- [ ] Add Kanban view.
- [ ] Add task detail drawer.
- [ ] Add evidence panel.
- [ ] Add approval queue.
- [ ] Add agent-runs panel.
- [ ] Surface current gate, missing evidence, and next allowed action.

### Verification

- [ ] Backend starts against local PostgreSQL.
- [ ] Migrations can run on a clean database.
- [ ] State survives backend restart.
- [ ] `maestroctl` can complete the first vertical slice.
- [ ] Cockpit reads the same state as `maestroctl`.
- [ ] Evidence files exist under `maestro/artifacts/current`.
- [ ] Run events are present for lifecycle transitions.
- [ ] Targeted backend tests pass.
- [ ] Targeted CLI tests pass.
- [ ] Targeted frontend tests pass.

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
