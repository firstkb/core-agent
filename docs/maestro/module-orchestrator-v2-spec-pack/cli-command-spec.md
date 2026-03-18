---
doc_status: proposal
doc_scope: future
doc_type: cli_spec
canonical_for: module_orchestrator_v2_cli
---

# Module Orchestrator V2 CLI Command Spec

This document defines the typed CLI surface aligned to the minimal artifact model.

The CLI is:

- the only legal writer of mutable JSON state;
- the allocator of attempt ids;
- the enforcer of canonical artifact paths.

Examples below use `agent-stack` as shorthand for:

```text
node .agent-cli/bin/agent-stack.mjs
```

---

## 1. Design Intent

The CLI exists to enforce these boundaries:

- lifecycle transitions happen through typed commands, not ad-hoc JSON edits;
- write-time validation happens at the mutation boundary;
- attempt ids and canonical paths are allocated consistently.

The CLI does not own:

- owner-facing reasoning;
- decomposition quality;
- downstream stage execution;
- business approval decisions;
- semantic narrative prose generation.

---

## 2. Design Principles

### 2.1. Typed over generic

Prefer:

```text
agent-stack module freeze-brief ...
```

Not:

```text
agent-stack patch-json --file status.json --set phase=brief_frozen
```

### 2.2. Validate at the write boundary

Validate the requested transition and the files it touches.

Do not re-validate the whole repository on every normal mutation.

### 2.3. No hidden state motion

A command that records an approval must not silently start execution.

A command that submits a handoff must not silently accept that handoff.

### 2.4. Markdown authorship belongs to AI, not the CLI

The CLI must not author Markdown content.

Markdown files are written by AI against canonical templates under `.agent-code/templates/`.

The CLI may:

- create directories;
- write mutable JSON state;
- copy an AI-authored attempt `README.md` into the canonical attempt path.

The CLI must not:

- create a seeded `brief.md` body;
- create a feature `README.md` body;
- synthesize an attempt `README.md` from handoff content.

---

## 3. Shared Conventions

### 3.1. Identifiers

- `module_id`, `feature_id`, `agent_id`, and `stage` are slug-like strings
- `attempt_id` follows `attempt-001`, `attempt-002`, and so on

### 3.2. Paths

Default artifact root:

```text
artifacts/<module>/
```

### 3.3. Exit codes

Suggested aligned exit codes:

- `0` — success
- `2` — schema validation failure
- `3` — illegal transition
- `4` — missing artifact or missing input file
- `5` — id collision or out-of-date generated file check
- `6` — policy guard failed
- `7` — internal CLI error

### 3.4. Output shape

Suggested response shape:

```json
{
  "ok": true,
  "command": "stage review",
  "writes": [
    "artifacts/avatar-service-test-execution/features/restore-executable-npm-test/status.json",
    "artifacts/avatar-service-test-execution/features/restore-executable-npm-test/stages/research/attempt-001/README.md"
  ],
  "state": {
    "feature_phase": "ready_for_stage"
  }
}
```

---

## 4. Active Command Surface

The aligned minimal kernel keeps this active surface:

- `module init`
- `module submit-for-brief-approval`
- `module return-to-discussion`
- `module record-owner-approval`
- `module freeze-brief`
- `module prepare-execution`
- `feature seed`
- `feature set-next-stage`
- `stage start`
- `stage submit-handoff`
- `stage review`
- `render-runtimes`

First-cut legal `stage review` decisions:

- `accept`
- `revise`

Deferred commands stay documented separately.

---

## 5. Module Commands

## 5.1. `module init`

Creates module root and the first mutable machine-state artifact.

Syntax:

```text
agent-stack module init --module <module_id>
```

Writes:

- `artifacts/<module>/status.json`

State effect:

- module phase becomes `discussion`

Guards:

- module id must not already exist

Notes:

- `status.json` reserves the canonical `brief.md` path
- AI authors `brief.md` separately before brief approval is requested

## 5.2. `module submit-for-brief-approval`

Moves the module from active discussion to owner brief approval.

Syntax:

```text
agent-stack module submit-for-brief-approval --module <module_id>
```

Writes:

- module `status.json`

State effect:

- module phase becomes `awaiting_owner_brief_approval`

Guards:

- current phase must be `discussion`
- `brief.md` must exist
- minimum completeness policy must pass

## 5.3. `module return-to-discussion`

Reopens the discussion loop after owner or orchestrator feedback.

Syntax:

```text
agent-stack module return-to-discussion --module <module_id>
```

Writes:

- module `status.json`

State effect:

- module phase becomes `discussion`

Guards:

- current phase must be `awaiting_owner_brief_approval`

## 5.4. `module record-owner-approval`

Records a human approval boundary without silently moving the next lifecycle step.

Syntax:

```text
agent-stack module record-owner-approval --module <module_id> --approval <brief|execution>
```

Writes:

- module `status.json`

State effect:

- sets one of:
  - `owner_approvals.brief = true`
  - `owner_approvals.execution = true`

Guards:

- `brief` approval requires module phase `awaiting_owner_brief_approval`
- `execution` approval requires module phase `awaiting_owner_execution_approval`

## 5.5. `module freeze-brief`

Freezes the approved brief without creating a second markdown snapshot file.

Syntax:

```text
agent-stack module freeze-brief --module <module_id>
```

Writes:

- module `status.json`

State effect:

- module phase becomes `brief_frozen`
- `brief.approved = true`
- `brief.frozen = true`

Guards:

- current phase must be `awaiting_owner_brief_approval`
- `owner_approvals.brief = true`
- `brief.md` must exist

## 5.6. `module prepare-execution`

Signals that feature creation is complete and execution may now await owner permission.

Syntax:

```text
agent-stack module prepare-execution --module <module_id>
```

Writes:

- module `status.json`

State effect:

- module phase becomes `awaiting_owner_execution_approval`

Guards:

- current phase must be `brief_frozen`
- at least one feature must exist
- each feature must have `README.md` and feature `status.json`

---

## 6. Feature Commands

## 6.1. `feature seed`

Creates feature root and feature state.

Syntax:

```text
agent-stack feature seed --module <module_id> --feature <feature_id>
```

Writes:

- `artifacts/<module>/features/<feature>/status.json`
- module `status.json`

State effect:

- feature phase becomes `seeded`
- feature id is appended to module feature list

Guards:

- module phase must be `brief_frozen`
- feature id must be new

Notes:

- in the aligned minimal model, AI authors feature packet content in `features/<feature>/README.md`

## 6.2. `feature set-next-stage`

Arms a seeded or already-ready feature for the next intended stage.

Syntax:

```text
agent-stack feature set-next-stage --module <module_id> --feature <feature_id> --stage <stage>
```

Writes:

- feature `status.json`

State effect:

- feature phase becomes `ready_for_stage`
- `next_stage` is updated

Guards:

- feature phase must be `seeded` or `ready_for_stage`
- feature must not have an active attempt

Notes:

- this command must not double as `feature unblock`

---

## 7. Stage Commands

## 7.1. `stage start`

Opens a new attempt for one feature stage.

Syntax:

```text
agent-stack stage start --module <module_id> --feature <feature_id> --stage <stage> --agent <agent_id>
```

Writes:

- attempt directory under `stages/<stage>/attempt-NNN/`
- feature `status.json`
- module `status.json`

State effect:

- feature phase becomes `stage_in_progress`
- `current_stage` becomes the requested stage
- `active_attempt_id` becomes the new attempt id
- `latest_attempt_id` becomes the new attempt id
- module phase becomes `executing` if not already executing

Guards:

- module phase must be `awaiting_owner_execution_approval` or `executing`
- `owner_approvals.execution = true`
- feature phase must be `ready_for_stage`
- no active attempt may exist
- if `next_stage` is already set, it must match `--stage`

## 7.2. `stage submit-handoff`

Submits the write-once handoff for the currently open attempt.

Syntax:

```text
agent-stack stage submit-handoff --module <module_id> --feature <feature_id> --stage <stage> --from <handoff.json> --readme <README.md>
```

Writes:

- `.../handoff.json`
- `.../README.md`
- feature `status.json`
- module `status.json`

State effect:

- feature phase becomes `awaiting_review`
- `active_attempt_id = null`
- `latest_submitted_handoff_ref` points to the submitted handoff

Guards:

- feature phase must be `stage_in_progress`
- `current_stage` must match `--stage`
- an active attempt must exist
- the input handoff must pass schema validation

Notes:

- `--readme` is required and must point to an AI-authored attempt `README.md`
- CLI copies that file into the canonical attempt path
- CLI must not synthesize semantic prose from the handoff payload

## 7.3. `stage review`

Applies the orchestrator decision to a specific attempt and appends that decision to the attempt `README.md`.

Syntax:

```text
agent-stack stage review --module <module_id> --feature <feature_id> --stage <stage> --attempt <attempt_id> --decision <accept|revise> --reason "<reason>" [--next-stage <stage>] [--complete]
```

Writes:

- attempt `README.md`
- feature `status.json`
- module `status.json`

State effect by decision:

- `accept --next-stage <stage>`:
  - feature phase becomes `ready_for_stage`
  - `current_stage = null`
  - `next_stage = <stage>`
  - `last_reviewed_attempt_id` and `last_reviewed_handoff_ref` updated
  - `last_decision = accept`
- `accept --complete`:
  - feature phase becomes `done`
  - `current_stage = null`
  - `next_stage = null`
  - `last_reviewed_attempt_id` and `last_reviewed_handoff_ref` updated
  - `last_decision = accept`
- `revise`:
  - feature phase becomes `ready_for_stage`
  - `current_stage = null`
  - `next_stage` defaults to the reviewed stage unless explicitly overridden later
  - `last_reviewed_attempt_id` and `last_reviewed_handoff_ref` updated
  - `last_decision = revise`

Guards:

- feature phase must be `awaiting_review`
- specified handoff must exist for the exact attempt id
- stage must match the feature `current_stage`
- `--reason` must be non-empty
- `accept` requires either `--next-stage` or `--complete`
- `revise` must not be combined with `--complete`

Notes:

- there is no separate `review.json` or `review.md` in the aligned minimal model
- decision binding is carried in feature `status.json`
- human-readable decision history is carried in attempt `README.md`

---

## 8. Build Command

## 8.1. `render-runtimes`

Renders runtime adapters and `AGENTS.md` from `.agent-code/`.

Syntax:

```text
agent-stack render-runtimes
agent-stack render-runtimes --check
```

Writes:

- `AGENTS.md`
- `.cursor/rules/*`
- `.cursor/agents/*`
- `.codex/config.toml`
- `.codex/agents/*`
- `.agents/skills/*/SKILL.md`

State effect:

- none on module or feature artifacts

Guards:

- templates, registry, and source-of-truth files must exist

Notes:

- `--check` fails if generated files are out of sync

---

## 9. Deferred Command Surface

These commands are intentionally out of scope for the aligned minimal kernel:

- `module request-brief-review`
- `module record-brief-review`
- `module resolve-owner-decision`
- `module block`
- `module reopen`
- `module close`
- `module cancel`
- `feature unblock`

Deferred review decisions:

- `block`
- `escalate_to_owner`

They become legal only when recovery paths are implemented.

---

## 10. Command Choreography For The Minimal Pilot

```text
agent-stack module init --module avatar-service-test-execution
agent-stack module submit-for-brief-approval --module avatar-service-test-execution
agent-stack module record-owner-approval --module avatar-service-test-execution --approval brief
agent-stack module freeze-brief --module avatar-service-test-execution
agent-stack feature seed --module avatar-service-test-execution --feature restore-executable-npm-test
agent-stack feature set-next-stage --module avatar-service-test-execution --feature restore-executable-npm-test --stage research
agent-stack module prepare-execution --module avatar-service-test-execution
agent-stack module record-owner-approval --module avatar-service-test-execution --approval execution
agent-stack stage start --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --agent research_codebase
agent-stack stage submit-handoff --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --from handoff.json --readme README.md
agent-stack stage review --module avatar-service-test-execution --feature restore-executable-npm-test --stage research --attempt attempt-001 --decision accept --next-stage implementation --reason "Research is sufficient to proceed."
```

---

## 11. Explicit Non-Goals For The Aligned Cut

The CLI must not support these in the aligned cut:

- arbitrary JSON patch commands
- repository-wide background validation on every mutation
- concurrent attempts for one feature
- automatic stage chaining without explicit review
- implicit owner approvals
- machine-state question management
- separate review artifact files
- separate queue, dispatch, or run-state JSON files
