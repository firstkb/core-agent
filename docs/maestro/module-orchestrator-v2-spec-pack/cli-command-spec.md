---
doc_status: proposal
doc_scope: future
doc_type: cli_spec
canonical_for: module_orchestrator_v2_cli
---

# Module Orchestrator V2 CLI Command Spec

This document defines the first typed CLI surface for the V2 state-gateway model.

The CLI is not a universal validator. It is the only legal writer of mutable JSON state and the allocator of revision ids and attempt ids.

---

## 1. Design intent

The CLI exists to enforce three boundaries:

- lifecycle transitions happen through typed commands, not ad-hoc JSON edits;
- write-time validation happens at the mutation boundary;
- artifact skeletons, revision ids, and attempt ids are allocated consistently.

The CLI does not own:

- owner-facing reasoning
- decomposition quality
- downstream stage execution
- business approval decisions

---

## 2. Command design principles

### 2.1. Typed over generic

Prefer:

```text
agent-cli module freeze-brief ...
```

Not:

```text
agent-cli patch-json --file status.json --set phase=brief_frozen
```

### 2.2. Lifecycle-specific over repository-wide validation

Prefer validating the one requested transition and the files it touches.

Do not re-validate the whole repository on every normal state mutation.

### 2.3. Explicit side effects

Every command should have well-defined outputs:

- which JSON files it writes
- which directories it creates
- whether it allocates a revision id
- whether it allocates an attempt id

### 2.4. No hidden state motion

A command that records an approval should not silently start stage execution.
A command that submits a handoff should not silently mark the stage accepted.

---

## 3. Shared conventions

### 3.1. Identifiers

- `module_id`, `feature_id`, `agent_id`, and `stage` are slug-like strings.
- `attempt_id` is CLI-allocated and follows `attempt-001`, `attempt-002`, and so on.

### 3.2. Paths

All commands are evaluated relative to repository root.

Default artifact root:

```text
artifacts/<module>/
```

### 3.3. Exit codes

Suggested first-cut exit codes:

- `0` — success
- `2` — schema validation failure
- `3` — illegal transition
- `4` — missing artifact or missing input file
- `5` — id collision
- `6` — policy guard failed
- `7` — internal CLI error

### 3.4. Output style

Each command should return machine-readable JSON to stdout unless `--quiet` or `--human` is requested.

Suggested response shape:

```json
{
  "ok": true,
  "command": "module freeze-brief",
  "writes": [
    "artifacts/avatar-service-test-execution/status.json",
    "artifacts/avatar-service-test-execution/revisions/brief.v1.md"
  ],
  "state": {
    "module_phase": "brief_frozen"
  }
}
```

---

## 4. Module commands

## 4.1. `module init`

Creates module root and first mutable artifacts.

Syntax:

```text
agent-cli module init --module <module_id> --owner <owner_id>
```

Writes:

- `artifacts/<module>/brief.md`
- `artifacts/<module>/status.json`

State effect:

- module phase becomes `discussion`

Guards:

- module id must not already exist

Notes:

- `owner_id` is metadata for traceability; it does not grant CLI authority by itself.

---

## 4.2. `module question add`

Appends an open question to module state.

Syntax:

```text
agent-cli module question add --module <module_id> --text "<question>"
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- appends to `open_questions`

Guards:

- module must exist
- module phase must not be terminal

---

## 4.3. `module question resolve`

Marks an open question as resolved by text match or id.

Syntax:

```text
agent-cli module question resolve --module <module_id> --text "<question>"
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- removes the question from `open_questions`

Guards:

- matching open question must exist

---

## 4.4. `module request-brief-review`

Requests optional readiness review for the current brief revision.

Syntax:

```text
agent-cli module request-brief-review --module <module_id>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- `brief_review.status = "pending"`

Guards:

- module phase must be `discussion`

---

## 4.5. `module record-brief-review`

Records the advisory result of brief readiness review.

Syntax:

```text
agent-cli module record-brief-review --module <module_id> --recommendation <ready|revise|blocked> [--reviewed-revision <path>]
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- `brief_review.status = "completed"`
- `brief_review.recommendation` updated

Guards:

- module phase must be `discussion`
- recommendation must be valid

Notes:

- this does not move module lifecycle by itself

---

## 4.6. `module submit-for-brief-approval`

Moves the module from active discussion to owner brief approval.

Syntax:

```text
agent-cli module submit-for-brief-approval --module <module_id>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes `awaiting_owner_brief_approval`

Guards:

- current phase must be `discussion`
- `brief.md` must exist
- minimum completeness policy must pass

---

## 4.7. `module return-to-discussion`

Reopens the discussion loop after owner or orchestrator feedback.

Syntax:

```text
agent-cli module return-to-discussion --module <module_id>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes `discussion`

Guards:

- current phase must be `awaiting_owner_brief_approval`

---

## 4.8. `module record-owner-approval`

Records a human approval boundary without silently moving the next lifecycle step.

Syntax:

```text
agent-cli module record-owner-approval --module <module_id> --approval <brief|execution>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- sets one of:
  - `owner_approvals.brief = true`
  - `owner_approvals.execution = true`

Guards:

- `brief` approval requires module phase `awaiting_owner_brief_approval`
- `execution` approval requires module phase `awaiting_owner_execution_approval`

Notes:

- approval recording and state transition remain separate on purpose

---

## 4.9. `module freeze-brief`

Allocates a new brief revision and freezes it for execution planning.

Syntax:

```text
agent-cli module freeze-brief --module <module_id>
```

Writes:

- `artifacts/<module>/revisions/brief.vN.md`
- `artifacts/<module>/status.json`

State effect:

- module phase becomes `brief_frozen`
- `brief.active_revision` points to the new revision
- `brief.frozen = true`

Guards:

- current phase must be `awaiting_owner_brief_approval`
- `owner_approvals.brief = true`
- `brief.md` must exist

Notes:

- `brief.md` remains as the human-readable current working copy, but the revision path becomes the authoritative frozen basis.

---

## 4.10. `module prepare-execution`

Signals that feature seeding is complete and execution may now await owner permission.

Syntax:

```text
agent-cli module prepare-execution --module <module_id>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes `awaiting_owner_execution_approval`

Guards:

- current phase must be `brief_frozen`
- at least one feature must exist
- each feature must have `packet.md`, packet revision, and feature `status.json`

---

## 4.11. `module resolve-owner-decision`

Resolves an owner decision gate and resumes execution.

Syntax:

```text
agent-cli module resolve-owner-decision --module <module_id> [--resume] [--cancel]
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- with `--resume`, module phase becomes `executing`
- with `--cancel`, module phase becomes `cancelled`

Guards:

- current phase must be `awaiting_owner_decision`

---

## 4.12. `module block`

Declares module-level blockage.

Syntax:

```text
agent-cli module block --module <module_id> --reason "<reason>"
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes `blocked`

Guards:

- current phase must not be terminal

---

## 4.13. `module reopen`

Reopens a blocked module to a specific allowed target.

Syntax:

```text
agent-cli module reopen --module <module_id> --to <discussion|executing>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes the requested target

Guards:

- current phase must be `blocked`
- requested target must satisfy policy guards

---

## 4.14. `module close`

Closes module execution.

Syntax:

```text
agent-cli module close --module <module_id> --status done
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes `done`

Guards:

- all required features must be `done`
- no feature may have an open attempt
- no feature may be awaiting stage review

---

## 4.15. `module cancel`

Cancels a module run.

Syntax:

```text
agent-cli module cancel --module <module_id>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes `cancelled`

Guards:

- current phase must not be `done` or `cancelled`

---

## 5. Feature commands

## 5.1. `feature seed`

Creates feature root, first packet revision, and feature state.

Syntax:

```text
agent-cli feature seed --module <module_id> --feature <feature_id>
```

Writes:

- `artifacts/<module>/features/<feature>/packet.md`
- `artifacts/<module>/features/<feature>/revisions/packet.v1.md`
- `artifacts/<module>/features/<feature>/status.json`
- `artifacts/<module>/status.json`

State effect:

- feature phase becomes `seeded`
- feature is appended to module feature list

Guards:

- module phase must be `brief_frozen`
- feature id must be new

Notes:

- the initial packet is expected to be frozen for execution use; later amendments must create new packet revisions.

---

## 5.2. `feature set-next-stage`

Arms a seeded or ready feature for the next intended stage.

Syntax:

```text
agent-cli feature set-next-stage --module <module_id> --feature <feature_id> --stage <stage>
```

Writes:

- `artifacts/<module>/features/<feature>/status.json`

State effect:

- feature phase becomes `ready_for_stage`
- `next_recommended_stage` is updated

Guards:

- feature phase must be `seeded` or `ready_for_stage` or `blocked`
- feature must not have an open attempt

---

## 5.3. `feature unblock`

Clears a feature block and sets the next stage to run.

Syntax:

```text
agent-cli feature unblock --module <module_id> --feature <feature_id> --stage <stage>
```

Writes:

- `artifacts/<module>/features/<feature>/status.json`

State effect:

- feature phase becomes `ready_for_stage`
- `blocked_reason = null`
- `next_recommended_stage` is updated

Guards:

- current feature phase must be `blocked`

---

## 6. Stage commands

## 6.1. `stage start`

Opens a new attempt for one feature stage.

Syntax:

```text
agent-cli stage start --module <module_id> --feature <feature_id> --stage <stage> --agent <agent_id>
```

Writes:

- attempt directory under `stages/<stage>/attempts/attempt-NNN/`
- feature `status.json`
- module `status.json` if module enters `executing`

State effect:

- feature phase becomes `stage_in_progress`
- `current_stage` becomes the requested stage
- a new attempt id is allocated
- module phase becomes `executing` if it was awaiting execution approval and execution approval is recorded

Guards:

- module phase must be `awaiting_owner_execution_approval` or `executing`
- `owner_approvals.execution = true`
- feature phase must be `ready_for_stage`
- no open attempt may exist for that feature

---

## 6.2. `stage submit-handoff`

Submits the write-once handoff for the currently open attempt.

Syntax:

```text
agent-cli stage submit-handoff --module <module_id> --feature <feature_id> --stage <stage> --from <handoff.json>
```

Writes:

- `.../handoff.json`
- `.../report.md`
- feature `status.json`

State effect:

- feature phase becomes `awaiting_stage_review`
- `latest_attempt_ref` points to the submitted attempt

Guards:

- feature phase must be `stage_in_progress`
- `current_stage` must match the stage argument
- an open attempt directory must exist
- the input handoff must pass schema validation

Notes:

- if `report.md` is not supplied externally, CLI may create it from the handoff summary plus metadata, but the downstream agent remains responsible for the semantic content.

---

## 6.3. `stage review`

Writes the orchestrator review for a specific attempt and applies the corresponding state transition.

Syntax:

```text
agent-cli stage review --module <module_id> --feature <feature_id> --stage <stage> --attempt <attempt_id> --decision <accept|revise|block|escalate_to_owner> [--next-stage <stage>] [--complete]
```

Writes:

- `.../review.json`
- `.../review.md`
- feature `status.json`
- module `status.json` when module state changes

State effect by decision:

- `accept --next-stage <stage>`:
  - feature phase becomes `ready_for_stage`
  - `current_stage = null`
  - `next_recommended_stage = <stage>`
  - `latest_accepted_review_ref` updated
- `accept --complete`:
  - feature phase becomes `done`
  - `current_stage = null`
  - `latest_accepted_review_ref` updated
- `revise`:
  - feature phase becomes `ready_for_stage`
  - `current_stage = null`
  - `next_recommended_stage` defaults to reviewed stage unless explicitly overridden
- `block`:
  - feature phase becomes `blocked`
- `escalate_to_owner`:
  - feature phase becomes `blocked`
  - module phase becomes `awaiting_owner_decision`

Guards:

- feature phase must be `awaiting_stage_review`
- specified handoff must exist for the exact attempt id
- stage must match the feature `current_stage`
- `accept` requires either `--next-stage` or `--complete`

Notes:

- the review is the technical acceptance boundary
- owner approval is separate and is never implied by `accept`

---

## 7. Command choreography for the first pilot

Recommended first bounded pilot:

```text
agent-cli module init --module avatar-service-test-execution --owner owner
agent-cli module question add --module avatar-service-test-execution --text "Is E2E required or only unit/integration?"
agent-cli module submit-for-brief-approval --module avatar-service-test-execution
agent-cli module record-owner-approval --module avatar-service-test-execution --approval brief
agent-cli module freeze-brief --module avatar-service-test-execution
agent-cli feature seed --module avatar-service-test-execution --feature restore-executable-npm-test
agent-cli feature set-next-stage --module avatar-service-test-execution --feature restore-executable-npm-test --stage research
agent-cli module prepare-execution --module avatar-service-test-execution
agent-cli module record-owner-approval --module avatar-service-test-execution --approval execution
agent-cli stage start --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --agent research_codebase
agent-cli stage submit-handoff --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --from handoff.json
agent-cli stage review --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --attempt attempt-001 --decision accept --next-stage implementation
```

---

## 8. Explicit non-goals for first cut

The CLI should not support these in the first cut:

- arbitrary JSON patch commands
- repository-wide background validation on every mutation
- concurrent attempts for one feature
- automatic stage chaining without explicit review
- implicit owner approvals
- separate queue, dispatch, or run-state files

These may appear later only if the first bounded loop proves insufficient.
