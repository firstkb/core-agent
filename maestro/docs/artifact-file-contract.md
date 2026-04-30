---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: artifact_file_contract
lang: en
---

# Maestro vNext Artifact File Contract

## Purpose

This document defines the file contract for flat Maestro work records under
`maestro/artifact/active/<work-slug>/` and
`maestro/artifact/archive/<work-slug>/`.

It follows the jet rule: create only the files required by the selected
`artifact_shape`.

## File Lifecycle Rules

- Work folders are one level deep under `active/` or `archive/`.
- `intent.md`, `brief.md`, `plan.md`, `task.md`, and `packet.md` are AI-authored
  human-facing Markdown.
- `handoff-<role>-NNN.json` files are machine-readable specialist handoffs.
- `snapshot.json` is an optional export, not primary mutable state.
- Handoff files are append-by-new-file, not overwritten.
- Evidence files and links must not contain secrets.
- `closeout.md` is written at closeout and may be amended only by appending a
  clearly marked correction block.

## Shape Matrix

| File | none | lightweight | staged_task | feature_work | full |
|---|---:|---:|---:|---:|---:|
| `intent.md` | no | yes | yes | yes | yes |
| `task.md` | no | optional | yes | yes | yes |
| `plan.md` | no | optional | yes | yes | yes |
| `packet.md` | no | no | optional | optional | optional |
| `handoff-<role>-NNN.json` | no | no | yes | yes | yes |
| `evidence.md` | no | optional | yes | yes | yes |
| `brief.md` | no | no | optional | yes | yes |
| `approval.md` | no | no | optional | optional | yes |
| `review.md` | no | no | optional | optional | optional |
| `release.md` | no | no | no | optional | optional |
| `snapshot.json` | no | no | no | optional | optional |
| `closeout.md` | no | yes | yes | yes | yes |

## Markdown Files

### `intent.md`

Role:

- current owner request, intent mode, route decision, and compact work identity.

Created when:

- `artifact_shape` is `lightweight`, `staged_task`, `feature_work`, or `full`.

Writer:

- Maestro.

Required sections:

- `Request`
- `Conversation Mode`
- `Route`
- `Current Goal`
- `Scope Notes`
- `Next Useful Action`

Rules:

- should stay short;
- may be updated while work is active;
- should not become a transcript.

### `brief.md`

Role:

- owner-facing scope brief for feature, module-sized, approval-heavy, or
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
- `Slices / Tasks`
- `Open Questions`
- `Owner Decisions`

Rules:

- durable scope and decisions belong here;
- transient lifecycle narration does not;
- after owner approval, changes require an explicit amendment block.

### `plan.md`

Role:

- adaptive plan for the current work folder.

Created when:

- planning is useful beyond a direct final response.

Writer:

- Maestro.

Required sections:

- `Route`
- `Current Decision`
- `Next Useful Action`
- `Possible Follow-Ups`
- `Risks`
- `Owner Decisions Needed`

Rules:

- represents the current plan, not a fixed workflow;
- may be updated when evidence or owner decisions change the next action.

### `task.md`

Role:

- bounded execution packet for one work item or slice.

Created when:

- the work needs implementation, verification, review, or handoff discipline.

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

### `packet.md`

Role:

- ready-to-launch packet for one specialist agent or stage.

Created when:

- a specialist subagent needs a portable launch prompt.

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

- may be regenerated for a new stage, revised attempt, or different specialist;
- must not grant scope beyond `task.md`.

### `evidence.md`

Role:

- human-readable evidence index for checks, links, screenshots, logs, and notes.

Created when:

- evidence should survive the chat.

Writer:

- Maestro, Scout, Mason, Scribe, or Release when assigned.

Required sections:

- `Checks Run`
- `Checks Skipped`
- `Evidence Links`
- `Browser Use`
- `Visual / Browser Notes`
- `Risks`

Rules:

- reference large logs or screenshots instead of embedding them;
- redact secrets and private credentials;
- distinguish verified facts from assumptions.
- for UI-visible work, record that Browser Use was used or explain why it was
  unavailable and what fallback evidence was used.

### `approval.md`

Role:

- approval gate requests and decisions.

Created when:

- execution, high-risk implementation, migration, release, security, or memory
  update approval is needed.

Writer:

- Maestro; owner/security/release decisions are recorded by Maestro after the
  decision is explicit.

Required sections:

- `Gate`
- `Reason`
- `Requested Action`
- `Required Evidence`
- `Decision`
- `Decision Actor`
- `Decision Time`

Rules:

- no high-risk execution proceeds before the required decision is recorded.

### `review.md`

Role:

- human-readable review findings when a Markdown review is clearer than a JSON
  handoff.

Created when:

- Lens review or owner review produces findings worth preserving.

Writer:

- Lens or Maestro.

Required sections:

- `Findings`
- `Missing Evidence`
- `Scope Drift`
- `Recommendation`

### `release.md`

Role:

- release, deployment, workflow dispatch, and rollback notes.

Created when:

- release or production-impacting action is in scope.

Writer:

- Release or Maestro.

Required sections:

- `Target`
- `Approval`
- `Commands / Workflow`
- `Result`
- `Rollback Notes`

### `closeout.md`

Role:

- final human-readable closeout for one work folder.

Created when:

- the work reaches completion, cancellation, freeze, or an owner-review boundary.

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

### `handoff-<role>-NNN.json`

Role:

- machine-readable result of one specialist attempt.

Created when:

- a specialist subagent returns a staged handoff.

Writer:

- the specialist stage agent.

Schema:

- `maestro/contracts/stage-handoff.schema.json`

Rules:

- write a new incrementing file for each attempt;
- do not overwrite prior handoffs;
- reference evidence rather than embedding large logs;
- may recommend the next stage but must not advance lifecycle.

### `snapshot.json`

Role:

- optional portable export of repository/work context.

Created when:

- cross-chat handoff, audit, or archive portability requires more context than
  Markdown files provide.

Writer:

- Maestro or assigned export tooling.

Minimum fields:

- `schema_version`
- `work_slug`
- `root_path`
- `branch`
- `commit`
- `created_at`
- `notes`

Rules:

- snapshot only;
- not live mutable state;
- not required for normal small work.
