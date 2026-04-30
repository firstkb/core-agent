---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: artifact_file_contract
lang: en
---

# Maestro vNext Artifact File Contract

## Purpose

This document defines the contract for each artifact file that Maestro vNext may
write when a route tier needs durable records.

It follows the jet rule: create only the files required by the selected
`artifact_shape`.

## File Lifecycle Rules

- `task.md`, `brief.md`, feature `README.md`, and `packet.md` are AI-authored
  human-facing Markdown.
- `handoff.json` and evidence indexes are machine-readable handoffs.
- `*.snapshot.json` files are optional exports, not primary mutable state.
- Attempt folders are append-only.
- A submitted `handoff.json` is write-once.
- Evidence files are immutable after attachment.
- `closeout.md` is written at closeout and may be amended only by appending a
  clearly marked correction block.

## Shape Matrix

| File | none | lightweight | staged_task | feature_work | full |
|---|---:|---:|---:|---:|---:|
| `task.md` | no | yes | yes | yes | yes |
| `closeout.md` | no | yes | yes | yes | yes |
| `evidence/` at work root | no | optional | optional | optional | optional |
| `stages/<stage>/attempt-*/README.md` | no | no | yes | yes | yes |
| `stages/<stage>/attempt-*/handoff.json` | no | no | yes | yes | yes |
| `stages/<stage>/attempt-*/evidence/` | no | no | optional | optional | optional |
| `brief.md` | no | no | optional | yes | yes |
| `features/<feature>/README.md` | no | no | no | yes | yes |
| `features/<feature>/tasks/<task>/...` | no | no | no | yes | yes |
| `packet.md` | no | optional | optional | optional | optional |
| `*.snapshot.json` | no | no | no | optional | optional |
| `approvals/` | no | no | no | optional | optional |

## Markdown Files

### `brief.md`

Role:

- owner-facing work brief for feature, module-sized, approval-heavy, or
  high-risk work.

Created when:

- `artifact_shape` is `feature_work` or `full`;
- or Maestro decides a brief is required before approval.

Writer:

- Maestro.

Required sections:

- `Request`
- `Goal`
- `Scope In`
- `Scope Out`
- `Constraints`
- `Approval Policy`
- `Acceptance Signals`
- `Feature / Task Breakdown`
- `Open Questions`
- `Owner Decisions`

Rules:

- durable scope and decisions belong here;
- transient lifecycle narration does not;
- after owner approval, changes require an explicit amendment block.

### `task.md`

Role:

- human-readable execution packet for one work item or one task.

Created when:

- `artifact_shape` is `lightweight`, `staged_task`, `feature_work`, or `full`.

Writer:

- Maestro.

Template:

- `maestro/templates/task.md.tmpl`

Required sections:

- `Identity`
- `Goal`
- `Scope In`
- `Scope Out`
- `Constraints`
- `Acceptance Signals`
- `Stage Plan`
- `Evidence Expectations`
- `Do Not Change`

Rules:

- must be bounded enough for an agent to execute without expanding scope;
- should be updated before execution starts, not rewritten after closeout.

### Feature `README.md`

Role:

- feature packet for one decomposition slice inside work.

Created when:

- `artifact_shape` is `feature_work` or `full`;
- a real feature decomposition is useful.

Writer:

- Maestro.

Required sections:

- `Identity`
- `Mission`
- `Purpose`
- `Scope In`
- `Scope Out`
- `Dependencies`
- `Constraints`
- `Acceptance Signals`

Rules:

- feature packet is durable after feature execution starts;
- mutable status stays in the active runtime context and optional snapshots.

### `packet.md`

Role:

- ready-to-launch packet for a specific agent or stage.

Created when:

- a stage needs a portable launch prompt or handoff to another chat or agent.

Writer:

- Maestro.

Required sections:

- `Assigned Role`
- `Stage`
- `Goal`
- `Allowed Scope`
- `Out Of Scope`
- `Required Reads`
- `Required Checks`
- `Expected Handoff`

Rules:

- may be regenerated for a new stage or revised attempt;
- must not grant scope beyond `task.md`.

### Attempt `README.md`

Role:

- human-readable report for one stage attempt.

Created when:

- a stage attempt is submitted.

Writer:

- stage agent for initial report;
- Maestro appends `Orchestrator Decision`.

Template:

- `maestro/templates/stage-attempt.md.tmpl`

Required sections:

- `Identity`
- `Task`
- `Work Performed`
- `Files Changed`
- `Commands Run`
- `Evidence`
- `Risks`
- `Recommended Next Stage`
- `Orchestrator Decision`

Rules:

- append-only after submission;
- correction requires a new attempt unless the correction is a clearly marked
  Maestro decision note.

### `closeout.md`

Role:

- final human-readable closeout for one work item.

Created when:

- the work reaches completion, cancellation, or an owner-review boundary.

Writer:

- Scribe or Maestro.

Template:

- `maestro/templates/closeout.md.tmpl`

Required sections:

- `Result`
- `Completed Stages`
- `Evidence Summary`
- `Approval Summary`
- `Changed Files`
- `Checks`
- `Memory And Docs Impact`
- `Residual Risks`
- `Next Action`

Rules:

- should stay compact;
- if updated after closeout, append a dated correction block.

## JSON Files

### `handoff.json`

Role:

- machine-readable result of one stage attempt.

Created when:

- a stage attempt is submitted.

Writer:

- stage agent.

Schema:

- `maestro/contracts/stage-handoff.schema.json`

Rules:

- write-once per attempt;
- must reference evidence rather than embedding large logs;
- may recommend the next stage but must not advance lifecycle.

### `evidence-index.json`

Role:

- machine-readable index of evidence attached to a work item or attempt.

Created when:

- evidence files are attached.

Writer:

- Maestro or the assigned agent.

Schema:

- each item follows `maestro/contracts/evidence.schema.json`.

Rules:

- evidence entries point to files, URLs, or external systems;
- evidence files are immutable after attachment.

### `repository.snapshot.json`

Role:

- portable export of repository/workspace context.

Created when:

- full artifact export is requested;
- cross-chat handoff or audit requires repo context.

Writer:

- Maestro or assigned export tooling.

Minimum fields:

- `schema_version`
- `repository_id`
- `root_path`
- `branch`
- `commit`
- `remote`
- `created_at`

Rules:

- snapshot only; not live mutable state.

### `work.snapshot.json`

Role:

- portable export of live work state.

Created when:

- full artifact export is requested.

Writer:

- Maestro or assigned export tooling.

Minimum fields:

- `schema_version`
- `work_id`
- `type`
- `status`
- `risk_level`
- `feature_ids`
- `task_ids`
- `approval_ids`
- `created_at`
- `updated_at`

Rules:

- snapshot only; not hand-edited.

### `feature.snapshot.json`

Role:

- portable export of one feature state.

Created when:

- feature state export is requested.

Writer:

- Maestro or assigned export tooling.

Rules:

- snapshot only; not hand-edited.

### `task.snapshot.json`

Role:

- portable export of one task state.

Created when:

- task state export is requested.

Writer:

- Maestro or assigned export tooling.

Rules:

- snapshot only; not hand-edited.

## Evidence Files

Evidence may include:

- command output logs;
- test reports;
- CI links;
- Storybook notes;
- browser screenshots;
- visual review notes;
- migration reports;
- security review notes;
- approval records;
- external links.

Large logs should live as files under `evidence/logs/` and be referenced from
`evidence-index.json`, not copied into Markdown.
