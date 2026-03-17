---
doc_status: proposal
doc_scope: future
doc_type: state_machine
canonical_for: module_orchestrator_v2
---

# Module Orchestrator V2 State Machine

This document turns the V2 control-plane proposal into a lifecycle specification.

It is normative for:

- module lifecycle states
- feature lifecycle states
- transition guards
- control-plane side effects
- attempt and review behavior

It is not a prompt. It is the control-plane contract that prompts and CLI commands must obey.

---

## 1. Core Invariants

The following invariants are non-negotiable.

### 1.1. Single lifecycle owner

`module_orchestrator` is the only lifecycle owner for a module.

No downstream stage agent may advance module or feature lifecycle on its own.

### 1.2. CLI is the only mutable state writer

Mutable JSON state is written only through CLI commands.

Agents may edit approved drafting documents during allowed windows, but they do not write `status.json`, `handoff.json`, or `review.json` directly as raw file mutations.

### 1.3. One live brief during discussion

During discussion there is exactly one mutable human document at module root:

- `brief.md`

No second live briefing document may be introduced in the first cut.

### 1.4. Narrative artifacts are frozen-by-default

Once a brief revision or feature packet revision is frozen, it is not silently edited.

Amendments create new revisions and move active pointers through CLI state operations.

### 1.5. Attempts are append-only

A stage retry creates a new attempt id and a new attempt directory.

Previous attempts remain intact.

### 1.6. Every handoff must be reviewed

A completed stage attempt is not actionable until `module_orchestrator` writes a paired review for that exact attempt.

---

## 2. State Objects

V2 tracks two durable lifecycle objects:

- `module`
- `feature`

A `stage` is not a top-level durable lifecycle object. It is a bounded execution step inside a feature.

An `attempt` is one try at one stage for one feature.

---

## 3. Module Lifecycle

## 3.1. Module states

| State | Meaning | Entry criteria | Exit conditions |
|---|---|---|---|
| `discussion` | Owner-facing clarification loop is active. `brief.md` is mutable. | `module init` | brief submitted for owner approval, blocked, or cancelled |
| `awaiting_owner_brief_approval` | Brief is strong enough for owner sign-off. | `module submit-for-brief-approval` | owner sends back for changes, or owner brief approval is recorded and brief is frozen |
| `brief_frozen` | An approved brief revision exists and is frozen. | `module freeze-brief` | features are seeded and module is prepared for execution approval |
| `awaiting_owner_execution_approval` | Feature packets exist and execution is waiting for owner permission. | `module prepare-execution` | owner execution approval plus first stage start, blocked, or cancelled |
| `executing` | At least one feature is active, reviewable, or ready to continue. | first legal `stage start` after execution approval, or owner decision resolves back to execution | module finishes, blocks, or needs owner decision |
| `awaiting_owner_decision` | Execution is paused for a business or scope decision. | stage review with `escalate_to_owner` or explicit orchestrator escalation | owner decision resolves and execution resumes, or module is cancelled |
| `done` | All required feature work is closed. | explicit close when completion criteria hold | terminal |
| `blocked` | Module cannot move without intervention. | explicit block or unresolved system condition | discussion, execution, or cancelled, depending on recovery policy |
| `cancelled` | Module run is terminated. | explicit cancel | terminal |

## 3.2. Module transition table

| From | Command / event | Guards | Side effects | To |
|---|---|---|---|---|
| — | `module init` | module id does not exist | create module root, create `brief.md`, create `status.json` | `discussion` |
| `discussion` | `module submit-for-brief-approval` | brief passes minimum completeness policy | update module phase; freeze editing window only logically, not physically | `awaiting_owner_brief_approval` |
| `awaiting_owner_brief_approval` | `module return-to-discussion` | owner or orchestrator requests edits | reopen discussion; keep prior review metadata | `discussion` |
| `awaiting_owner_brief_approval` | `module record-owner-approval --approval brief` | owner approval is being recorded | set `owner_approvals.brief = true` | `awaiting_owner_brief_approval` |
| `awaiting_owner_brief_approval` | `module freeze-brief` | `owner_approvals.brief = true`; active brief working file exists | allocate brief revision id; write frozen revision; set brief pointer; set `brief.frozen = true` | `brief_frozen` |
| `brief_frozen` | `feature seed` | feature id is new; brief frozen | create feature packet and feature status | `brief_frozen` |
| `brief_frozen` | `module prepare-execution` | at least one feature exists; each feature has packet + status | set execution gate pending | `awaiting_owner_execution_approval` |
| `awaiting_owner_execution_approval` | `module record-owner-approval --approval execution` | owner execution approval is being recorded | set `owner_approvals.execution = true` | `awaiting_owner_execution_approval` |
| `awaiting_owner_execution_approval` | `stage start` | `owner_approvals.execution = true`; target feature is ready | allocate attempt id; create stage attempt skeleton | `executing` |
| `executing` | `stage review --decision escalate_to_owner` | reviewed attempt exists | write review artifacts; mark owner input required | `awaiting_owner_decision` |
| `awaiting_owner_decision` | `module resolve-owner-decision --resume` | owner decision recorded; at least one feature can continue | clear owner decision gate | `executing` |
| `executing` | `module block` | orchestrator determines module-level block | set blocked reason in module status | `blocked` |
| `blocked` | `module reopen --to discussion` | block is resolved at planning layer | clear block reason | `discussion` |
| `blocked` | `module reopen --to executing` | block is resolved and execution can resume | clear block reason | `executing` |
| `discussion` / `awaiting_owner_brief_approval` / `brief_frozen` / `awaiting_owner_execution_approval` / `executing` / `awaiting_owner_decision` / `blocked` | `module cancel` | cancellation policy allows it | mark module cancelled; no further transitions | `cancelled` |
| `executing` | `module close --status done` | all required features are `done`; no open attempts; no unresolved review | set completion metadata | `done` |

## 3.3. Module state invariants

- `phase = discussion` implies `brief.frozen = false`.
- `phase in {brief_frozen, awaiting_owner_execution_approval, executing, awaiting_owner_decision, done, blocked}` implies `owner_approvals.brief = true`.
- `phase in {awaiting_owner_execution_approval, executing, awaiting_owner_decision, done, blocked}` implies at least one feature exists.
- `phase = executing` implies `owner_approvals.execution = true`.
- `phase = done` implies every non-cancelled feature is `done`.

---

## 4. Feature Lifecycle

## 4.1. Feature states

Feature phase is coarse. Stage identity is carried separately by `current_stage` and `next_recommended_stage`.

| Phase | Meaning | Required fields |
|---|---|---|
| `seeded` | Feature root exists and packet exists, but no stage has been armed yet. | packet active revision |
| `ready_for_stage` | Feature may begin a stage. | `next_recommended_stage` or an explicit stage at start time |
| `stage_in_progress` | One attempt is running for one stage. | `current_stage`, active attempt |
| `awaiting_stage_review` | An attempt has produced a handoff and is waiting for orchestrator review. | `current_stage`, latest attempt ref |
| `done` | Feature work is complete. | latest accepted review ref |
| `blocked` | Feature cannot continue until intervention. | blocked reason |

## 4.2. Feature transition table

| From | Command / event | Guards | Side effects | To |
|---|---|---|---|---|
| — | `feature seed` | feature id does not exist; module is `brief_frozen` or `awaiting_owner_execution_approval` | create feature root, packet, status | `seeded` |
| `seeded` | `feature set-next-stage --stage <stage>` | packet exists | set `next_recommended_stage` | `ready_for_stage` |
| `ready_for_stage` | `stage start --stage <stage>` | module execution approved; no active attempt; stage allowed by policy | allocate attempt id; set `current_stage`; clear block reason | `stage_in_progress` |
| `stage_in_progress` | `stage submit-handoff --from handoff.json` | open attempt exists; handoff passes schema validation | write handoff; update latest attempt ref | `awaiting_stage_review` |
| `awaiting_stage_review` | `stage review --decision accept --next-stage <stage>` | matching handoff exists | write review; set next stage; clear current stage; update latest accepted review ref | `ready_for_stage` |
| `awaiting_stage_review` | `stage review --decision accept --complete` | reviewed handoff is sufficient to finish feature | write review; clear current stage; update latest accepted review ref | `done` |
| `awaiting_stage_review` | `stage review --decision revise` | matching handoff exists | write review; clear current stage; typically set next stage = reviewed stage unless overridden | `ready_for_stage` |
| `awaiting_stage_review` | `stage review --decision block` | matching handoff exists | write review; set blocked reason | `blocked` |
| `awaiting_stage_review` | `stage review --decision escalate_to_owner` | matching handoff exists | write review; set blocked reason = `owner_decision_required`; module may move to `awaiting_owner_decision` | `blocked` |
| `blocked` | `feature unblock --stage <stage>` | block is resolved; module is not cancelled | clear blocked reason; set next stage | `ready_for_stage` |

## 4.3. Feature state invariants

- `phase = stage_in_progress` implies `current_stage != null`.
- `phase = awaiting_stage_review` implies `current_stage != null` and `latest_attempt_ref != null`.
- `phase in {seeded, ready_for_stage, done, blocked}` implies no open attempt exists.
- `phase = done` implies `latest_accepted_review_ref != null`.
- `phase = blocked` implies `blocked_reason != null`.

---

## 5. Stage Attempt Model

## 5.1. One open attempt per feature

A feature may have at most one open attempt at a time.

V2 does not allow two concurrent attempts for one feature in the first cut.

## 5.2. Attempt lifecycle

1. `stage start` allocates `attempt-###`.
2. Downstream stage agent works inside that attempt.
3. `stage submit-handoff` closes execution and moves the feature to review waiting.
4. `stage review` binds the review to that exact attempt.

## 5.3. Retry behavior

If the review decision is `revise`, the next execution uses a new attempt id.

Example:

- `attempt-001` — research attempt, reviewed as `revise`
- `attempt-002` — new research attempt with amended guidance

No files from `attempt-001` are overwritten.

---

## 6. Unified Review Contract

A stage is only complete when both sides of the pair exist:

- execution side: `handoff.json` and `report.md`
- control-plane side: `review.json` and `review.md`

## 6.1. Review decision mapping

| Decision | Meaning | Feature result | Module result |
|---|---|---|---|
| `accept` | attempt is technically sufficient | `ready_for_stage` or `done` | remain `executing`, or later `done` if all features done |
| `revise` | attempt did not reach acceptable quality but work can continue | `ready_for_stage` with retry | remain `executing` |
| `block` | feature cannot continue without intervention | `blocked` | usually remain `executing` unless module-wide blockage is declared |
| `escalate_to_owner` | owner decision is required before proceeding | `blocked` with owner-decision reason | `awaiting_owner_decision` |

## 6.2. Review binding rules

- A review must reference one exact `attempt_id`.
- A review must reference one exact `reviewed_handoff_ref`.
- Only one accepted review may become `latest_accepted_review_ref` at a time.
- A later accepted review supersedes earlier accepted reviews only by pointer update, never by deletion.

---

## 7. Artifact Allocation Rules

Recommended artifact layout:

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
        <stage>/
          attempts/
            attempt-001/
              handoff.json
              report.md
              review.json
              review.md
```

Allocation rules:

- `module init` creates module root, `brief.md`, and module `status.json`.
- `module freeze-brief` creates `revisions/brief.vN.md`.
- `feature seed` creates feature root, `packet.md`, feature `status.json`, and `revisions/packet.v1.md`.
- `stage start` creates the attempt directory.
- `stage submit-handoff` writes `handoff.json` and `report.md`.
- `stage review` writes `review.json` and `review.md`.

---

## 8. Illegal Patterns

The following patterns are illegal in V2:

- downstream agent edits `module/status.json` directly
- downstream agent starts the next stage automatically
- a retry overwrites a previous attempt directory
- a review exists without a matching handoff
- a handoff is treated as accepted before review exists
- `brief.md` is silently rewritten after freeze without a new revision
- `packet.md` is silently rewritten after freeze without a new revision
- feature phase uses stage names directly as durable phase values

---

## 9. First bounded pilot

The first bounded pilot should prove only this loop:

`discussion -> brief approval -> brief freeze -> feature seed -> execution approval -> research attempt -> stage review`

Only after that loop is stable should V2 add more downstream stages or a more parallel execution model.
