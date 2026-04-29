---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: ui_cockpit_contract
lang: en
---

# Maestro Cockpit UI Contract

## Purpose

Maestro Cockpit is the owner-facing operational console for Maestro vNext. It is
not a generic project tracker. Its job is to make orchestration state visible:
route tier, current gate, next allowed action, assigned agent, evidence,
approval status, and residual risk.

## Product Rule

Keep the cockpit compact and calm. Prefer a small set of dense operational views
over dashboards that duplicate the same state in decorative forms.

## Phase 1 Scope

Phase 1 assumes one implicit current workspace and repository.

Required views:

- Dashboard
- Work table
- Work/task Kanban
- Task detail drawer
- Evidence panel
- Approval queue
- Agent runs panel

Out of scope for Phase 1:

- portfolio dashboards;
- cross-repository analytics;
- cloud worker fleet administration;
- long-term velocity reporting;
- custom workflow builders.

## Dashboard

Purpose:

- show current orchestration health;
- highlight work requiring owner attention;
- expose blocked, paused, high-risk, failed, and review-needed items.

Required sections:

- active work count by status;
- active agent runs;
- approvals waiting on owner;
- blocked or paused work;
- failed verification or review;
- recent evidence and closeouts.

The dashboard must answer one question quickly: "what needs action now?"

## Work Table

Purpose:

- provide the densest operational list for scanning and triage.

Required columns:

- ID
- title
- type
- route tier
- artifact shape
- status
- risk
- priority
- active stage
- assigned agent
- approvals
- evidence status
- CI status
- visual status
- PR
- updated time

Required filters:

- needs approval
- blocked
- paused
- running
- failed checks
- needs review
- needs browser pass
- high risk
- frontend
- backend
- docs/memory
- no evidence

## Kanban

Purpose:

- provide a lightweight stage/status board for owner steering.

Default columns:

- Intake
- Ready
- Running
- Needs Verification
- Needs Review
- Awaiting Approval
- Blocked
- Done

Rules:

- cards show title, type, risk, active stage, assigned agent, and missing gate;
- drag/drop may request a transition but must still pass API gate checks;
- high-risk cards must visibly expose approval requirements;
- Kanban is a view over state, not an independent state store.

## Task Detail Drawer

Purpose:

- keep detail inspection fast without losing table or board context.

Required sections:

- identity: title, ID, type, route tier, artifact shape, risk, priority;
- scope: goal, in scope, out of scope, do-not-change;
- current gate: blocking approval, dependency, evidence, or review;
- next allowed action;
- feature and dependency links;
- stage list with current attempt;
- attempts and handoffs;
- evidence grouped by type and attempt;
- approvals and decisions;
- comments and external links;
- PR, branch, CI, and visual status.

The drawer should make it obvious whether the work can proceed, needs owner
input, or should stay blocked.

## Evidence Panel

Purpose:

- make proof visible before review, approval, closeout, or release.

Evidence must be grouped by:

- task or work target;
- stage;
- attempt;
- evidence type.

Required evidence types:

- command
- test
- browser
- visual
- Storybook
- CI
- review
- approval
- release
- note

The panel must show missing required evidence separately from attached evidence.

## Approval Queue

Purpose:

- centralize owner/security/release decisions.

Required fields:

- approval type;
- target work/task/stage;
- requested by;
- reason;
- risk level;
- affected paths or surface;
- required evidence;
- current status;
- decision actions.

Decision actions:

- approve
- reject
- request revision
- cancel

Approvals must append audit events and must not silently mutate unrelated state.

## Agent Runs Panel

Purpose:

- show what agents are doing and where orchestration is waiting.

Required fields:

- agent role;
- assigned work/task/stage;
- attempt;
- status;
- started time;
- last event time;
- pause/cancel availability;
- current checkpoint;
- handoff status.

Rules:

- specialist agents recommend next actions but do not advance lifecycle alone;
- run status is observational until a typed transition is accepted;
- stale or missing handoff state must be visible to the owner.

## Visual Style

- minimal calm SaaS;
- compact table density;
- subtle borders and status pills;
- no marketing hero;
- no decorative dashboards;
- approval and evidence state must be more visually prominent than agent
  branding.
