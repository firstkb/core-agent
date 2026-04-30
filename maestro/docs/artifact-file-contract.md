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
- Handoffs are append-by-new-file.
- Evidence and logs must not contain secrets.
- `closeout.md` may be amended only by appending a clearly marked correction.

## Shape Matrix

| File | none | lightweight | staged | multi_step | full |
|---|---:|---:|---:|---:|---:|
| `intent.md` | no | yes | yes | yes | yes |
| `plan.md` | no | optional | optional | yes | yes |
| `task.md` | no | optional | yes | yes | yes |
| `packet.md` | no | no | yes | yes | yes |
| `approval-*.json` | no | no | optional | optional | yes |
| `handoff-<stage>-<role>-NNN.json` | no | no | yes | yes | yes |
| `evidence.md` | no | optional | yes | yes | yes |
| `review.md` | no | no | optional | optional | optional |
| `release.md` | no | no | no | optional | optional |
| `closeout.md` | no | yes | yes | yes | yes |

## Required File Semantics

### `intent.md`

Captures owner request, conversation mode, route tier, current goal, scope notes,
and next useful action. Keep it compact; do not turn it into a transcript.

### `plan.md`

Captures the current adaptive plan, risks, possible follow-ups, and owner
decisions. It is allowed to change as evidence changes the next useful action.

### `task.md`

Captures a bounded owner-readable task or slice with scope in/out, constraints,
acceptance, stage plan, evidence expectations, and do-not-change boundaries.

### `packet.md`

Captures a specialist-ready packet with `work_id`, `packet_id`, route tier,
assigned stage/role, path scope, approvals, evidence expectations, stop
conditions, and handoff expectations. Machine-readable packets should validate
against `maestro/contracts/task-packet.schema.json`.

### `approval-*.json`

Captures approval gates. High-risk implementation, release, memory migration,
runtime restore, destructive operations, and production-impacting actions require
machine-readable approval. Human Markdown notes are optional and not sufficient.

### `handoff-<stage>-<role>-NNN.json`

Captures a specialist stage result. It must validate against
`maestro/contracts/stage-handoff.schema.json` when used as a machine-readable
handoff.

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
