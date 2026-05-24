---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: artifact_file_contract
lang: en
---

# Maestro vNext Artifact File Contract

## Purpose

This document defines the file contract for flat Maestro work records under
`maestro/artifact/active/<work-slug>/` and
`maestro/artifact/archive/<work-slug>/`.

## Lifecycle Rules

- Work folders are one level deep under `active/` or `archive/`.
- Use the smallest useful `artifact_shape`.
- Handoffs are append-by-new-file only when machine-readable handoff is needed.
- Evidence and logs must not contain secrets.
- `closeout.md` may be amended only by appending a clearly marked correction.
- Normal persisted work should prefer `work.md`, `evidence.md`, and
  `closeout.md`.
- For T1+ persisted work, Maestro creates or updates `work.md` once the task is
  understood; the owner should not need to approve artifact creation as a
  separate process step.
- Product-code edits and high-risk gates still follow conversation mode and
  approval rules.

## Shape Matrix

| File | none | lightweight | staged | multi_step | full |
|---|---:|---:|---:|---:|---:|
| `work.md` | no | yes | yes | yes | yes |
| `intent.md` / `plan.md` | no | optional legacy/expanded | optional legacy/expanded | optional expanded | optional expanded |
| `task.md` | no | optional | yes | yes | yes |
| `packet.md` | no | no | optional | optional | optional |
| `approval-*.json` | no | no | no unless gated | no unless gated | yes for real gates |
| `agent-<role>-NNN.md` | no | no | optional | optional | optional |
| `handoff-<stage>-<role>-NNN.json` | no | no | optional | optional | optional/required when gated |
| `evidence.md` | no | optional | yes | yes | yes |
| `review.md` | no | no | optional | optional | optional |
| `release.md` | no | no | no | optional | optional |
| `closeout.md` | no | yes | yes | yes | yes |

## Required File Semantics

### `work.md`

Captures the owner request, Maestro's understanding, current status, agreed
scope, decisions, plan, risks, agent/tool notes, and next useful action. Keep it
compact and owner-readable. It is the preferred continuation file.

`work.md` must include a lightweight `Goal Alignment` block that links the
owner strategy, product/user risk, current action, and exit criteria. Its
`Status` field uses the canonical queue statuses: `in_progress`,
`waiting_owner`, `blocked`, `close_ready`, or `archived`.

### `intent.md`

Captures owner request, conversation mode, route tier, current goal, scope notes,
and next useful action. This remains valid for expanded or legacy artifacts, but
new normal work should prefer `work.md`.

### `plan.md`

Captures the current adaptive plan, risks, possible follow-ups, and owner
decisions. It is allowed to change as evidence changes the next useful action.
If Grant audits the plan, add a compact `Audit Status` section after revisions
with the Grant handoff ref, verdict, whether required revisions were applied,
and whether the plan is ready for owner approval.

### `task.md`

Captures a bounded owner-readable task or slice with scope in/out, constraints,
acceptance, stage plan, evidence expectations, and do-not-change boundaries.

### `packet.md`

Captures a specialist-ready packet with `work_id`, `packet_id`, route tier,
assigned stage/role, path scope, approvals, evidence expectations, stop
conditions, and handoff expectations. Machine-readable packets should validate
against `maestro/contracts/task-packet.schema.json`.

Do not create packet files for every internal step. Use them when delegation,
resume, or auditability needs a bounded machine-readable assignment.

### `approval-*.json`

Captures approval gates. High-risk implementation, release, memory migration,
runtime restore, destructive operations, and production-impacting actions require
machine-readable approval. Human Markdown notes are optional and not sufficient.

Do not create approval records for ordinary specialist launch, low-risk
follow-up fixes inside accepted scope, checks, Browser Use, or evidence updates.

### `agent-<role>-NNN.md`

Optional human-readable specialist note. Use when a specialist result is useful
for continuation but does not need machine-readable handoff structure.

### `handoff-<stage>-<role>-NNN.json`

Captures a specialist stage result. It must validate against
`maestro/contracts/stage-handoff.schema.json` when used as a machine-readable
handoff. Any specialist result that changes next action, gate readiness, risk,
or scope must be persisted in `work.md`, `evidence.md`, an agent note, or a
handoff before Maestro treats it as durable state.

For low-risk normal work, prefer `agent-<role>-NNN.md` or a short note in
`work.md`/`evidence.md` unless a machine-readable handoff adds real value.

## Resume Read Order

When resuming from an artifact folder, read in this order when present:

1. `work.md`
2. legacy or expanded `intent.md` / `plan.md`
3. `approval-*.json`
4. latest `agent-*.md` and `handoff-*.json`
5. `evidence.md`
6. `closeout.md`

Use the latest append-only handoffs to reconstruct current stage status and next
allowed action. Chat history is helpful context, but artifact files are the
portable continuation state.

### `evidence.md`

Indexes command, test, browser, CI, review, approval, release, migration,
security, or manual evidence. It must state skipped checks and why.

### `review.md`

Optional owner-readable review notes. Lens handoffs remain the machine-readable
review surface.

### `release.md`

Optional owner-readable release note, target environment, release command or
workflow, result, and rollback/recovery note.

### `closeout.md`

Final owner-readable summary: what changed, what evidence exists, skipped
checks, approvals, residual risks, follow-ups, and archive location.

## Append-Only Attempts

When repeating a stage, increment `NNN`:

```text
handoff-implementation-mason-001.json
handoff-verification-scout-001.json
handoff-implementation-mason-002.json
handoff-verification-scout-002.json
```

Never overwrite prior handoffs to make the run look cleaner.
