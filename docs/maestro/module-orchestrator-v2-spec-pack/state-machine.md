---
doc_status: proposal
doc_scope: future
doc_type: state_machine
canonical_for: module_orchestrator_v2
---

# Module Orchestrator V2 State Machine

This document defines the simplified V2 lifecycle aligned to the minimal artifact model.

It is normative for:

- module lifecycle states
- feature lifecycle states
- stage attempt rules
- CLI transition guards
- artifact side effects

If this document conflicts with older V2 drafts that assumed `feature-index.md`, revision directories, or review files, this document wins.

---

## 1. Core Invariants

### 1.1. Single lifecycle owner

`module_orchestrator` is the only lifecycle owner for a module and its features.

Downstream stage agents do not advance lifecycle directly.

### 1.2. CLI is the only mutable state writer

Mutable machine state is written only through typed CLI commands.

Agents do not patch `status.json` directly.

### 1.3. One live module brief

There is exactly one brief document at module root:

- `brief.md`

It stays editable during discussion and becomes frozen by process rule after owner approval.

### 1.4. One feature packet document

Each feature has exactly one packet document:

- `features/<feature>/README.md`

It is created from the approved decomposition in `brief.md` and is frozen after creation.

### 1.5. Attempts are append-only

Each retry allocates a new folder:

- `attempt-001`
- `attempt-002`
- `attempt-003`

No prior attempt files are overwritten.

### 1.6. No separate review artifact in the minimal model

The attempt-level pair is:

- `handoff.json`
- `README.md`

The attempt `README.md` carries both:

- the stage narrative;
- the appended orchestrator decision block.

The current/latest machine-readable decision lives in feature `status.json`.

### 1.7. First-cut review decisions remain narrow

In the minimal aligned cut, `stage review` supports only:

- `accept`
- `revise`

`block` and `escalate_to_owner` stay deferred to `Phase 3`.

### 1.8. Feature roster order is meaningful

`module.status.json.features` is an ordered roster.

It must preserve:

- the owner-approved feature order from `brief.md`;
- dependency-first ordering when one feature depends on another.

### 1.9. Feature execution is sequential in the first cut

The first cut does not launch multiple features in parallel.

Operational rule:

- arm and launch one feature at a time;
- finish or accept the active feature to its next stable boundary before starting the next feature;
- do not start a dependent feature before its declared upstream dependency is accepted far enough to unblock it.

---

## 2. Durable State Objects

V2 tracks two durable mutable lifecycle objects:

- `module`
- `feature`

A `stage` is a bounded execution step inside a feature.

An `attempt` is one try at one stage for one feature.

There are only three JSON families in the minimal model:

- module `status.json`
- feature `status.json`
- stage `handoff.json`

---

## 3. Module Lifecycle

## 3.1. Module states

| State | Meaning | First cut |
|---|---|---|
| `discussion` | Owner-facing clarification loop is active. `brief.md` is AI-authored and mutable when present. | yes |
| `awaiting_owner_brief_approval` | Brief is ready for owner sign-off. | yes |
| `brief_frozen` | Brief is approved and frozen for feature seeding. | yes |
| `awaiting_owner_execution_approval` | Features exist and execution is waiting for owner permission. | yes |
| `executing` | At least one feature is running, waiting for review, or ready for the next stage. | yes |
| `awaiting_owner_decision` | Execution is paused for a business decision. | deferred |
| `blocked` | Module cannot move without intervention. | deferred |
| `done` | All required feature work is closed. | later |
| `cancelled` | Module run is terminated. | later |

## 3.2. First-cut module transitions

| From | Command / event | Guards | Side effects | To |
|---|---|---|---|---|
| — | `module init` | module id does not exist | create module root; create module `status.json` with canonical `brief.md` path reserved | `discussion` |
| `discussion` | `module submit-for-brief-approval` | `brief.md` passes minimum completeness policy | update module phase | `awaiting_owner_brief_approval` |
| `awaiting_owner_brief_approval` | `module return-to-discussion` | owner or orchestrator requests edits | reopen discussion | `discussion` |
| `awaiting_owner_brief_approval` | `module record-owner-approval --approval brief` | owner brief approval is being recorded | set `owner_approvals.brief = true` | `awaiting_owner_brief_approval` |
| `awaiting_owner_brief_approval` | `module freeze-brief` | `owner_approvals.brief = true`; `brief.md` exists | set `brief.approved = true`; set `brief.frozen = true` | `brief_frozen` |
| `brief_frozen` | `feature seed` | feature id does not exist | create feature `README.md`; create feature `status.json`; append feature id to module state | `brief_frozen` |
| `brief_frozen` | `module prepare-execution` | at least one feature exists; each feature has `README.md` + `status.json` | update module phase | `awaiting_owner_execution_approval` |
| `awaiting_owner_execution_approval` | `module record-owner-approval --approval execution` | owner execution approval is being recorded | set `owner_approvals.execution = true` | `awaiting_owner_execution_approval` |
| `awaiting_owner_execution_approval` | `stage start` | `owner_approvals.execution = true`; target feature is ready | allocate attempt id; create attempt directory | `executing` |
| `executing` | `stage review --decision accept --complete` for final active feature | all required work is complete | optional later cut | later |

Notes:

- `feature seed` does not move the module out of `brief_frozen`.
- `module prepare-execution` is the explicit boundary between seeding and execution.
- In the aligned minimal model, `module freeze-brief` no longer creates a separate snapshot file.
- if multiple features exist, the module-level `features[]` roster preserves the approved execution order.

## 3.3. Deferred module transitions

These transitions are intentionally outside the aligned first cut:

| From | Command / event | To | Planned phase |
|---|---|---|---|
| `executing` | `stage review --decision escalate_to_owner` | `awaiting_owner_decision` | `Phase 3` |
| `awaiting_owner_decision` | `module resolve-owner-decision --resume` | `executing` | `Phase 3` |
| `executing` | `module block` | `blocked` | `Phase 3` |
| `blocked` | `module reopen --to discussion` | `discussion` | `Phase 3` |
| `blocked` | `module reopen --to executing` | `executing` | `Phase 3` |
| lifecycle non-terminal | `module cancel` | `cancelled` | later |
| `executing` | `module close --status done` | `done` | later |

## 3.4. Module state invariants

- `phase = discussion` implies `brief.frozen = false`.
- `phase in {brief_frozen, awaiting_owner_execution_approval, executing, awaiting_owner_decision, blocked, done}` implies `owner_approvals.brief = true`.
- `phase in {awaiting_owner_execution_approval, executing, awaiting_owner_decision, blocked, done}` implies at least one feature exists.
- `phase = executing` implies `owner_approvals.execution = true`.

---

## 4. Feature Lifecycle

## 4.1. Feature states

| Phase | Meaning | First cut |
|---|---|---|
| `seeded` | Feature root exists and `README.md` exists, but no stage is armed yet. | yes |
| `ready_for_stage` | Feature may begin the next stage. | yes |
| `stage_in_progress` | One attempt is running for one stage. | yes |
| `awaiting_review` | An attempt has produced a handoff and is waiting for orchestrator review. | yes |
| `done` | Feature work is complete. | optional in aligned cut |
| `blocked` | Feature cannot continue without intervention. | deferred |

## 4.2. First-cut feature transitions

| From | Command / event | Guards | Side effects | To |
|---|---|---|---|---|
| — | `feature seed` | module phase is `brief_frozen`; feature id is new | create feature root; create feature `status.json` with canonical feature `README.md` path reserved | `seeded` |
| `seeded` | `feature set-next-stage --stage <stage>` | feature packet exists | set `next_stage` | `ready_for_stage` |
| `ready_for_stage` | `feature set-next-stage --stage <stage>` | no open attempt | replace `next_stage` | `ready_for_stage` |
| `ready_for_stage` | `stage start --stage <stage>` | module execution approved; stage allowed; no active attempt | set `current_stage`; set `active_attempt_id`; set `latest_attempt_id` | `stage_in_progress` |
| `stage_in_progress` | `stage submit-handoff --from handoff.json --readme README.md` | active attempt exists; handoff passes schema validation; AI-authored attempt `README.md` exists | write `handoff.json`; copy attempt `README.md`; clear `active_attempt_id`; set `latest_submitted_handoff_ref` | `awaiting_review` |
| `awaiting_review` | `stage review --decision accept --next-stage <stage>` | matching handoff exists | append decision block to attempt `README.md`; clear `current_stage`; set `last_decision`; set `next_stage` | `ready_for_stage` |
| `awaiting_review` | `stage review --decision accept --complete` | reviewed attempt is sufficient to finish feature | append decision block to attempt `README.md`; clear `current_stage`; set final decision | `done` |
| `awaiting_review` | `stage review --decision revise` | matching handoff exists | append decision block to attempt `README.md`; clear `current_stage`; set `next_stage` back to reviewed stage unless overridden later | `ready_for_stage` |

## 4.3. Deferred feature transitions

| From | Command / event | To | Planned phase |
|---|---|---|---|
| `awaiting_review` | `stage review --decision block` | `blocked` | `Phase 3` |
| `awaiting_review` | `stage review --decision escalate_to_owner` | `blocked` | `Phase 3` |
| `blocked` | `feature unblock --stage <stage>` | `ready_for_stage` | `Phase 3` |

## 4.4. Feature state invariants

- `phase = stage_in_progress` implies `current_stage != null` and `active_attempt_id != null`.
- `phase = awaiting_review` implies `current_stage != null`, `active_attempt_id = null`, and `latest_submitted_handoff_ref != null`.
- `phase in {seeded, ready_for_stage, done, blocked}` implies `active_attempt_id = null`.
- `last_decision != null` implies both `last_reviewed_attempt_id != null` and `last_reviewed_handoff_ref != null`.
- `phase = blocked` implies `blocked_reason != null`.
- in the current first cut, at most one feature in a module should be actively running a stage at a time.

---

## 5. Stage Attempt Model

## 5.1. One open attempt per feature

A feature may have at most one open attempt at a time.

The aligned first cut does not support concurrent attempts for one feature.

## 5.2. Attempt lifecycle

1. `stage start` allocates `attempt-###`.
2. Downstream stage agent works inside that attempt folder.
3. `stage submit-handoff` writes `handoff.json` and attempt `README.md`.
4. `stage review` appends the decision block to the same `README.md`.

## 5.3. Retry behavior

If a review decision is `revise`, the next execution uses a new attempt id.

Example:

- `attempt-001` — research attempt, reviewed as `revise`
- `attempt-002` — new research attempt with amended guidance

Nothing inside `attempt-001` is overwritten.

---

## 6. Decision Binding Rules

Because the minimal model has no `review.json`, decision binding is carried by feature state.

Required binding fields:

- `last_reviewed_attempt_id`
- `last_reviewed_handoff_ref`
- `last_decision`
- `last_decision_reason`

Why these are required:

- `latest_attempt_id` may point to a newer running attempt after a retry;
- the latest decision must still remain bound to the exact reviewed attempt and handoff.

---

## 7. Artifact Allocation Rules

Recommended artifact layout:

```text
artifacts/<module>/
  brief.md
  status.json
  features/
    <feature>/
      README.md
      status.json
      stages/
        <stage>/
          attempt-001/
            handoff.json
            README.md
```

Allocation rules:

- `module init` creates module root, `brief.md`, and module `status.json`.
- `module freeze-brief` only updates module state. It does not allocate a second brief file.
- `feature seed` creates feature root, feature `README.md`, and feature `status.json`.
- `stage start` creates the attempt directory.
- `stage submit-handoff` writes `handoff.json` and attempt `README.md`.
- `stage review` appends the decision block to attempt `README.md` and updates feature state.

---

## 8. Illegal Patterns

The following patterns are illegal in the aligned minimal model:

- raw agent edits to mutable JSON state
- creation of `brief-approved.md` or `feature-index.md` in the minimal aligned flow
- creation of `review.json` or `review.md`
- creation of an `attempts/` parent directory
- feature seeding after module phase leaves `brief_frozen`
- opening a second attempt while one attempt is still active
- overwriting a prior attempt folder
- CLI-authored semantic narrative prose from handoff summary fields
- automatic stage chaining without an explicit review decision
