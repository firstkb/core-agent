---
doc_status: proposal
doc_scope: future
doc_type: replacement_spec
canonical_for: module_orchestrator_v2
---

# Module Orchestrator Control Plane V2

Status: Revised proposal. This document defines a replacement control-plane model for `module_orchestrator` and is intended to supersede earlier V2 discussion drafts where conflicts appear.

This is not a patch plan for the current Maestro package. It is a future-state replacement model built around four principles:

- control-plane first
- CLI as state gateway
- frozen-by-default narrative artifacts
- one lifecycle owner per module

---

## 1. Purpose

Build a new orchestration stack in which:

- `module_orchestrator` owns the lifecycle of a module;
- `CLI` is the only legal writer of mutable machine state;
- Markdown stores human-readable knowledge and frozen execution packets;
- JSON stores runtime truth;
- downstream stage agents produce handoff artifacts, but do not move lifecycle state on their own.

This model is meant to replace the current validator-heavy, prompt-heavy orchestration path instead of incrementally extending it forever.

---

## 2. Core Terms

To avoid ambiguity, V2 uses the following terms.

### 2.1. Module

A module is one owner-facing unit of work created from a user request.
It is the top-level lifecycle object owned by `module_orchestrator`.

### 2.2. Feature

A feature is an execution slice derived from a module.
A module may contain one or many features.

### 2.3. Stage

A stage is one bounded execution step for a feature.
Examples:

- `research`
- `design`
- `implementation`
- `review`
- `documentation`

### 2.4. Handoff

A handoff is the write-once output of one stage attempt.
It is produced by a downstream agent and submitted back to `module_orchestrator`.

### 2.5. Review

A review is the technical decision made by `module_orchestrator` about a specific handoff.
A review is not the same thing as owner approval.

### 2.6. Owner Approval

Owner approval is a human decision about scope, business intent, or whether execution may proceed.
It must never be silently replaced by agent judgment.

### 2.7. Attempt

An attempt is one execution try for one feature stage.
Retries must create a new attempt. They must not overwrite prior handoff or review artifacts.

---

## 3. Executive Summary

The target operating model is:

- `module_orchestrator` receives an owner request and runs the discussion loop.
- During discussion there is exactly one live human document: `brief.md`.
- Mutable JSON state is created and changed only through typed CLI commands.
- Once the owner approves the brief, the brief is frozen and versioned.
- The module is decomposed into features.
- Each feature receives a frozen execution packet.
- Downstream stages operate only on their packet and return bounded handoff artifacts.
- `module_orchestrator` reviews each stage output and decides whether to accept, revise, block, or escalate.
- Owner approval is required only at explicit business and execution boundaries.

Short formula:

`module_orchestrator` = lifecycle owner  
`CLI` = state gateway  
`Markdown` = frozen knowledge  
`JSON` = runtime truth

---

## 4. Non-Negotiable Design Principles

### 4.1. Single Lifecycle Owner

`module_orchestrator` is the single lifecycle owner of a module.

It:

- accepts the request;
- runs discussion;
- maintains the brief;
- freezes the execution packet;
- seeds features;
- dispatches downstream stages;
- receives handoffs;
- writes stage review decisions;
- requests owner approval at defined boundaries;
- closes the module.

It does not perform deep research, implementation, or specialist review work itself.

### 4.2. One Live Brief During Discussion

During discussion there is exactly one mutable human document:

- `brief.md`

That document must be structured. It is not an unbounded notes file.

Recommended sections:

- goal
- scope
- non-goals
- constraints
- acceptance signals
- open questions
- proposed feature decomposition

### 4.3. JSON Mutability Only Through CLI

Agents must not edit `status.json` or other mutable state files directly.

The correct control flow is:

1. the agent makes a semantic decision;
2. the agent requests a lifecycle action through CLI;
3. the CLI validates the requested transition against the contract;
4. the CLI writes the JSON state.

### 4.4. Frozen-By-Default Narrative Artifacts

Markdown artifacts are frozen by default.

They are:

- mutable only in explicitly allowed drafting windows;
- write-once after freeze;
- revised through explicit versioning instead of silent edits.

If requirements change after freeze, the system must create:

- a new brief revision;
- a new packet revision;
- or an addendum artifact;

and point to the active revision through JSON state.

### 4.5. Stage Agents Produce Handoffs, Not Lifecycle Decisions

Downstream stage agents:

- perform bounded stage work;
- create handoff artifacts;
- may recommend a next stage;
- do not move feature or module lifecycle on their own;
- do not approve downstream execution;
- do not silently chain stages.

### 4.6. Approvals Must Stay Human

The following concepts must remain separate:

1. readiness recommendation;
2. technical review of a completed stage;
3. business approval / scope approval.

Correct split:

- a helper may return readiness advice;
- `module_orchestrator` may return a technical stage decision;
- only the owner may approve scope and execution entry.

### 4.7. Retries Must Be Append-Only

If a stage must be retried, the system creates a new attempt.
It does not overwrite the previous handoff or review.

This rule is critical for:

- auditability;
- machine reasoning about the latest accepted state;
- rollback and comparison;
- avoiding hidden drift.

---

## 5. Target Operating Model

### 5.1. Discussion Loop

The discussion loop is owner-facing.

`module_orchestrator` should:

- create the module root;
- create `brief.md` and module `status.json`;
- ask clarifying questions;
- update only `brief.md` as the live narrative artifact;
- request optional brief readiness review when useful;
- stop when the brief is strong enough for owner approval.

### 5.2. Brief Readiness Review

A helper mode such as `brief_readiness_reviewer` may be invoked:

- when the owner requests it;
- when `module_orchestrator` recommends it;
- when ambiguity or weak acceptance criteria are detected.

This helper returns one of:

- `ready`
- `revise`
- `blocked`

This output is advisory. It does not replace owner approval.

### 5.3. Freeze And Package

After owner brief approval:

- the brief is frozen and versioned;
- the module feature set is finalized for the current revision;
- `feature-index.md` is created;
- feature packets are created;
- feature status files are created.

The result is a frozen execution package, not a large template dump.

### 5.4. Execution Control Loop

After owner execution approval:

- one or more feature stages may start;
- each stage runs as an attempt;
- downstream agent submits a handoff;
- `module_orchestrator` performs stage review;
- the feature either proceeds, revises, blocks, or escalates.

For V2, this loop should remain controlled by `module_orchestrator`.
Do not introduce a second execution orchestrator until parallel execution pressure proves the need.

---

## 6. Responsibility Model

### 6.1. `module_orchestrator`

Primary responsibilities:

- owner-facing discussion
- brief maintenance
- feature decomposition
- feature seeding
- stage dispatch
- stage review
- lifecycle ownership

### 6.2. `brief_readiness_reviewer` Helper Mode

In the first cut this should be a helper mode or helper skill, not a permanent standalone system agent.

Its job:

- find ambiguity;
- detect contradictions;
- test acceptance quality;
- surface assumptions;
- return `ready`, `revise`, or `blocked`.

It must never approve the brief on behalf of the owner.

### 6.3. Downstream Stage Agents

Examples:

- `research_codebase`
- future design agents
- future implementation agents
- future review agents

Their job:

- execute only the assigned stage;
- create the stage handoff;
- return bounded outputs back to `module_orchestrator`.

### 6.4. Owner

Owner responsibilities:

- scope approval;
- brief approval;
- execution approval;
- business-level decisions escalated from review.

### 6.5. CLI

CLI responsibilities:

- create mutable JSON state;
- validate legal transitions at write time;
- persist lifecycle updates;
- create filesystem skeletons when required;
- allocate revision ids and attempt ids;
- update active pointers to revisions, handoffs, and reviews.

CLI does not own:

- decomposition decisions;
- owner communication;
- stage execution;
- narrative reasoning.

---

## 7. Lifecycle Model

### 7.1. Module Lifecycle States

Recommended module phases:

- `discussion`
- `awaiting_owner_brief_approval`
- `brief_frozen`
- `awaiting_owner_execution_approval`
- `executing`
- `awaiting_owner_decision`
- `done`
- `blocked`
- `cancelled`

Interpretation:

- `discussion`: live clarification loop with mutable `brief.md`
- `awaiting_owner_brief_approval`: brief is ready for owner sign-off
- `brief_frozen`: approved brief revision is frozen and becomes the source for execution packaging
- `awaiting_owner_execution_approval`: features are seeded and execution is waiting for owner permission
- `executing`: at least one feature has active stage work or is cycling through stage review
- `awaiting_owner_decision`: execution is paused for a business decision
- `done`: module is closed successfully
- `blocked`: lifecycle cannot continue without intervention
- `cancelled`: run terminated by owner or system

Note that optional brief review is an activity inside `discussion`, not a separate durable lifecycle phase.

### 7.2. Feature Lifecycle States

Feature lifecycle should remain coarse and durable.

Recommended feature phases:

- `seeded`
- `ready_for_stage`
- `stage_in_progress`
- `awaiting_stage_review`
- `done`
- `blocked`

Feature status should also carry:

- `current_stage`
- `next_recommended_stage`

This is better than using stage names as lifecycle phases.

Example:

- `phase = stage_in_progress`
- `current_stage = research`

### 7.3. Allowed Transition Shape

At minimum, V2 must define allowed transitions for:

Module:

- `discussion -> awaiting_owner_brief_approval`
- `awaiting_owner_brief_approval -> discussion`
- `awaiting_owner_brief_approval -> brief_frozen`
- `brief_frozen -> awaiting_owner_execution_approval`
- `awaiting_owner_execution_approval -> executing`
- `executing -> awaiting_owner_decision`
- `executing -> done`
- `executing -> blocked`
- `blocked -> discussion`
- `blocked -> cancelled`

Feature:

- `seeded -> ready_for_stage`
- `ready_for_stage -> stage_in_progress`
- `stage_in_progress -> awaiting_stage_review`
- `awaiting_stage_review -> ready_for_stage`
- `awaiting_stage_review -> done`
- `awaiting_stage_review -> blocked`
- `blocked -> ready_for_stage`

### 7.4. First Practical Loop

The first stable V2 loop should be:

`discussion -> owner brief approval -> freeze -> feature seeding -> owner execution approval -> research attempt -> stage review`

Do not over-design later stages before this first loop is stable.

---

## 8. Artifact Model

### 8.1. Module-Level Required Artifacts

Required:

- `brief.md` as the live working brief during discussion
- `status.json`
- `feature-index.md` after freeze

Optional, trigger-only:

- `architecture-note.md`
- `owner-decisions.md`
- `risk-note.md`

### 8.2. Feature-Level Required Artifacts

Required:

- `packet.md`
- `status.json`

### 8.3. Stage-Level Required Artifacts

Each stage attempt must produce:

- `handoff.json`
- `report.md`

Each reviewed attempt must also have:

- `review.json`
- `review.md`

### 8.4. Revisioning Rules

During discussion:

- `brief.md` is the live working file.

After freeze:

- the CLI snapshots the brief into a revisioned location, for example `revisions/brief.v1.md`;
- `status.json` points to the active frozen revision.

If the brief is later amended:

- create `revisions/brief.v2.md`;
- never silently rewrite the frozen revision.

The same rule applies to `packet.md` if a feature packet must be amended after approval.

### 8.5. Attempt Rules

Stage outputs must be append-only.

If research is run twice, the system must create:

- `attempt-001`
- `attempt-002`

and keep both.

State should point to the latest attempt and latest accepted review.

### 8.6. Suggested Directory Shape

Recommended V2 layout:

```text
artifacts/<module>/
  brief.md
  status.json
  feature-index.md
  revisions/
    brief.v1.md
  features/
    <feature>/
      packet.md
      status.json
      revisions/
        packet.v1.md
      stages/
        research/
          attempts/
            attempt-001/
              handoff.json
              report.md
              review.json
              review.md
```

This shape deliberately separates:

- module-root narrative;
- feature-root packet;
- stage-attempt outputs.

It also gives retries a safe home without overwriting prior artifacts.

---

## 9. JSON Contracts

V2 should start with exactly four JSON contract families.
Do not add more until these prove insufficient.

### 9.1. Module Status

Main module lifecycle state.

Minimum responsibilities:

- identify the module;
- record module lifecycle phase;
- point to the live brief and active frozen brief revision;
- record owner approvals;
- list feature ids;
- expose current action and open questions.

Suggested example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "phase": "discussion",
  "brief": {
    "working_path": "artifacts/avatar-service-test-execution/brief.md",
    "active_revision": null,
    "frozen": false
  },
  "owner_approvals": {
    "brief": false,
    "execution": false
  },
  "brief_review": {
    "status": "not_requested",
    "recommendation": null,
    "reviewed_revision": null
  },
  "open_questions": [],
  "features": [],
  "current_action": "awaiting_owner_input",
  "updated_at": "2026-03-17T00:00:00Z"
}
```

### 9.2. Feature Status

Main feature lifecycle state.

Minimum responsibilities:

- identify the feature;
- record lifecycle phase;
- record current stage;
- point to the active packet revision;
- point to the latest attempt and latest accepted review;
- record blocked reason when relevant.

Suggested example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "feature_id": "restore-executable-npm-test",
  "phase": "stage_in_progress",
  "current_stage": "research",
  "next_recommended_stage": null,
  "packet": {
    "working_path": "artifacts/avatar-service-test-execution/features/restore-executable-npm-test/packet.md",
    "active_revision": "artifacts/avatar-service-test-execution/features/restore-executable-npm-test/revisions/packet.v1.md",
    "frozen": true
  },
  "latest_attempt_ref": null,
  "latest_accepted_review_ref": null,
  "blocked_reason": null,
  "updated_at": "2026-03-17T00:00:00Z"
}
```

### 9.3. Stage Handoff

Write-once downstream output for one attempt.

Minimum responsibilities:

- identify module, feature, stage, and attempt;
- identify the producing agent;
- state the result of the attempt;
- summarize findings or work completed;
- reference produced artifacts and evidence;
- recommend a next stage or escalation.

Suggested example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "feature_id": "restore-executable-npm-test",
  "stage": "research",
  "attempt_id": "attempt-001",
  "agent_id": "research_codebase",
  "result": "ready_for_review",
  "summary": "The root cause of the test failure is localized to an import mismatch.",
  "evidence_refs": [],
  "produced_artifact_refs": [],
  "change_requests": [],
  "recommended_next_stage": "implementation",
  "created_at": "2026-03-17T00:00:00Z"
}
```

### 9.4. Stage Review

Write-once `module_orchestrator` decision about one specific attempt.

Minimum responsibilities:

- identify the reviewed stage and attempt;
- link the review to one handoff;
- record the decision;
- explain the reason;
- indicate next stage or escalation;
- record whether owner input is required.

Suggested example:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution",
  "feature_id": "restore-executable-npm-test",
  "reviewed_stage": "research",
  "attempt_id": "attempt-001",
  "reviewed_handoff_ref": "artifacts/avatar-service-test-execution/features/restore-executable-npm-test/stages/research/attempts/attempt-001/handoff.json",
  "decision": "accept",
  "reason": "Research is sufficient to proceed to implementation.",
  "requires_owner_input": false,
  "next_stage": "implementation",
  "reviewed_at": "2026-03-17T00:00:00Z"
}
```

### 9.5. Explicit Non-Goal

Do not introduce `task.json`, `run.json`, `queue.json`, `dispatch.json`, or other additional state files in the first cut unless a new responsibility clearly appears that cannot be expressed through the four contract families above.

---

## 10. Unified Review Contract

Every completed stage attempt must have a paired review.

That means:

1. downstream stage agent writes `handoff.json` and `report.md`;
2. `module_orchestrator` evaluates that handoff;
3. `module_orchestrator` writes `review.json` and `review.md`;
4. CLI updates feature state pointers to the latest attempt and latest accepted review.

This creates an explicit control-plane boundary between:

- stage execution;
- technical acceptance;
- lifecycle transition.

### 10.1. Review Decisions

The review decision enum should remain small:

- `accept`
- `revise`
- `block`
- `escalate_to_owner`

### 10.2. Why This Matters

Without a unified review contract, the system cannot reliably answer:

- which attempt was reviewed;
- whether the handoff was accepted or only observed;
- whether the next stage may begin;
- whether owner input is required;
- which artifact is the currently accepted basis for future work.

---

## 11. CLI As State Gateway

### 11.1. Mental Model

V2 CLI must be treated as a:

`state gateway`

not as a universal validator of the whole repository at all times.

### 11.2. What CLI Must Do

- create initial mutable JSON from contracts and inputs;
- validate transition payloads on write;
- apply only legal lifecycle transitions;
- create skeleton artifact directories;
- allocate attempt ids and revision ids;
- update active revision pointers;
- reject contradictory state writes.

### 11.3. What CLI Must Stop Doing

- re-validating the whole artifact universe on every small change;
- encouraging agents to patch raw JSON directly;
- exposing generic patch commands that allow arbitrary field mutation.

### 11.4. Recommended Command Style

Prefer typed lifecycle commands such as:

```text
agent-cli module init --module avatar-service-test-execution --owner user
agent-cli module question add --module avatar-service-test-execution --text "Is E2E required or only unit/integration?"
agent-cli module submit-for-brief-approval --module avatar-service-test-execution
agent-cli module record-owner-approval --module avatar-service-test-execution --approval brief
agent-cli module freeze-brief --module avatar-service-test-execution
agent-cli feature seed --module avatar-service-test-execution --feature restore-executable-npm-test
agent-cli module record-owner-approval --module avatar-service-test-execution --approval execution
agent-cli stage start --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --agent research_codebase
agent-cli stage submit-handoff --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --from handoff.json
agent-cli stage review --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --decision accept
```

The internal implementation may later compress or refactor these commands, but the control-plane model should remain typed and lifecycle-specific.

### 11.5. Validation Boundary

Validation should happen:

- when state is created;
- when state is changed;
- when a transition is requested.

Validation should not try to re-validate the entire repository for every normal state change.

---

## 12. Review And Approval Model

### 12.1. Brief Readiness Review

The brief helper returns one of:

- `ready`
- `revise`
- `blocked`

This is advisory only.

### 12.2. Technical Stage Review

`module_orchestrator` writes:

- `review.json`
- `review.md`

This is the binding technical decision for one completed stage attempt.

### 12.3. Owner Approval Boundaries

Owner approval is required for:

- scope acceptance;
- brief acceptance;
- execution entry;
- any business decision escalated from review.

No system agent should be called `approver` if it can be confused with owner authority.

---

## 13. Deliberate Breaks From Current Maestro

This proposal intentionally breaks from the current architecture in several ways.

### 13.1. Discussion Pack Collapse

Current direction:

- multiple mutable narrative documents during briefing

V2 direction:

- one live `brief.md`

### 13.2. Validator-First To State-Gateway First

Current direction:

- broad validation passes after many edits

V2 direction:

- typed lifecycle commands that validate at write boundary

### 13.3. Mutable Narrative To Frozen Narrative

Current direction:

- narrative documents may drift after lifecycle changes

V2 direction:

- freeze, version, and point to active revisions through state

### 13.4. Agent-Written State To CLI-Written State

Current direction:

- agents effectively own the shape of mutable JSON

V2 direction:

- agents declare intent, CLI writes state

### 13.5. Single Execution Owner For Now

V2 explicitly keeps one lifecycle owner:

- `module_orchestrator`

Do not split into:

- owner-facing Maestro
- separate execution orchestrator

until real parallel multi-feature pressure proves the need.

### 13.6. Overwriting Stage Outputs To Append-Only Attempts

Current direction:

- stage outputs risk being replaced in place

V2 direction:

- every retry creates a new attempt directory and a new review pair

---

## 14. Phased Implementation Plan

### Phase 1. Freeze The State Machine

Deliverables:

- module lifecycle states
- feature lifecycle states
- stage vocabulary
- allowed transitions
- owner approval boundaries

### Phase 2. Define The Four JSON Contract Families

Deliverables:

- module status schema
- feature status schema
- stage handoff schema
- stage review schema

Do not add new JSON families in this phase.

### Phase 3. Rebuild CLI As State Gateway

Deliverables:

- lifecycle-specific commands
- write-boundary validation
- revision pointer updates
- attempt allocation
- artifact skeleton generation

### Phase 4. Simplify The Artifact Set

Deliverables:

- `brief.md`
- `feature-index.md`
- `packet.md`
- stage `handoff/report/review`
- revision and attempt layout

Do not port the full current template set into V2 by default.

### Phase 5. Rewrite Prompts And Runtime Rules

Prompts and rules must be rewritten against the V2 lifecycle model.
Do not keep adapting the old Maestro package indefinitely.

### Phase 6. Run One Bounded Pilot

Use one bounded scenario, such as the avatar-service test-execution module, as the first V2 pilot.

Success criteria:

- one live brief in discussion;
- JSON state only through CLI;
- frozen packets after approval;
- append-only stage attempts;
- clean handoff and review pairing;
- no narrative drift.

---

## 15. Recommendation

The architecture should move forward under this principle:

> do not keep extending the current Maestro stack indefinitely;  
> define a new control-plane model, prove it on one bounded pilot,  
> and only then decide whether to replace the current canonical stack.

This proposal recommends building V2 as a parallel architecture track first.
