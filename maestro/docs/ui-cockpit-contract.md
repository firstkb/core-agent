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

Cockpit is not the agent runtime. Native Codex subagents and skills remain the
execution path. Cockpit records and displays what happened.

## Product Rule

Keep the cockpit compact and calm. Prefer a small set of dense operational views
over dashboards that duplicate the same state in decorative forms.

## Phase 1 Scope

Phase 1 assumes one implicit current workspace and repository.

Required views:

- Dashboard
- Work queue
- Work detail drawer
- Artifacts viewer
- Evidence panel
- Approval queue
- Agent runs panel

Out of scope for Phase 1:

- portfolio dashboards;
- cross-repository analytics;
- cloud worker fleet administration;
- long-term velocity reporting;
- custom workflow builders.
- automated native-agent runner.

## Dashboard

Purpose:

- show current orchestration health;
- highlight work requiring owner attention;
- expose blocked, paused, high-risk, failed, and review-needed items.
- avoid low-level event streams on the owner home screen.

Required sections:

- owner work count;
- agent task count;
- active agent runs;
- approvals waiting on owner;
- blocked or paused work;
- failed verification or review.

The dashboard must answer one question quickly: "what needs action now?"

## Work Queue

Purpose:

- provide the densest operational list for scanning and triage.
- record every meaningful owner request, including lightweight tasks solved
  through Maestro.
- make the distinction between owner work and agent task explicit.

Terminology:

- Work: what the owner asked Maestro to do.
- Agent task: the executable slice Maestro assigns or prepares for an agent.
- Agent run: an observed execution attempt for an agent task.

Canonical Phase 1 columns:

- ID
- work title
- status
- risk
- priority
- current agent task
- agent role
- run or gate status
- owner signal
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

Columns such as route tier, artifact shape, PR, CI, visual, events, and detailed
evidence belong outside the primary queue until task volume proves they need
table space.

## Kanban

Purpose:

- optional secondary visualization when the owner needs a board.

Kanban is parked for Phase 1 unless the task volume proves that board movement
adds clarity. The Work queue remains canonical.

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

## Work Detail Drawer

Purpose:

- keep detail inspection fast without losing table context.
- show the selected work first and the current agent task second.

Required sections:

- overview: compact signal tiles, current state, active runs, approvals, and
  latest handoff;
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

Phase 1 drawer tabs:

- Overview
- Evidence
- Artifacts
- Agent

Do not expose stage, attempt, packet, approval, and event tabs as separate
top-level tabs. Those are implementation details and may appear only inside the
Agent tab or a future advanced mode.

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

## Artifacts Viewer

Purpose:

- make handoffs, evidence files, generated packets, JSON, Markdown, and logs
  readable without leaving Cockpit.

Required behavior:

- read `artifact://current/...` files through the API;
- reject path traversal and non-artifact URIs;
- pretty-print JSON;
- render Markdown in a compact readable preview;
- show raw text for logs and unknown text files;
- show binary files as downloadable or base64 metadata until a specialized
  viewer exists;
- link artifacts back to task, attempt, evidence, or agent run.

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
- keep role capability information compact; do not turn the page into an agent
  catalog.

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
- event streams are diagnostic detail, not a primary page section.

## Visual Style

- minimal calm SaaS;
- compact table density;
- subtle borders and status pills;
- no marketing hero;
- no decorative dashboards;
- approval and evidence state must be more visually prominent than agent
  branding.
