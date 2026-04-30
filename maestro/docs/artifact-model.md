---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: artifact_model
lang: en
---

# Maestro vNext Artifact Model

## Design Goal

Maestro artifacts are compact work records for native human-agent engineering
work. They preserve useful intent, decisions, evidence, and closeout without
becoming a project-management tree.

Create only the files that help a new chat continue the work, review the
result, prove evidence, preserve a real decision, or archive the outcome.

## Active And Archive Layout

```text
maestro/artifact/
  active/
    YYYY-MM-DD-<work-slug>/
      work.md
      evidence.md
      closeout.md
      agent-charlie-001.md
      agent-mason-001.md
      approval-001.json
  archive/
    YYYY-MM-DD-<work-slug>/
      ...
```

`work.md`, `evidence.md`, and `closeout.md` are the normal persisted shape.
Agent notes, packets, handoffs, and approval JSON are optional escalation files,
not the default interface.

`active/` may contain multiple active work folders. `archive/` uses the same
folder name after closeout, cancellation, or freeze.

Do not confuse:

- `maestro/artifact/archive/` = completed Maestro work records;
- retired role/skill provenance = owner-managed outside the active repository.

## Work Folder Naming

Preferred folder name:

```text
YYYY-MM-DD-<work-slug>
```

Use a short slug only for local scratch work that will not be archived.

## Artifact Shapes

| Shape | Use | Default Files |
|---|---|---|
| `none` | T0 direct inline work | no folder |
| `lightweight` | small persisted work | `work.md`, optional `closeout.md` |
| `staged` | delegated or evidence-heavy work | `work.md`, `evidence.md`, `closeout.md`, optional agent note or handoff |
| `multi_step` | one owner goal needs several linear steps or dependencies | `work.md`, `evidence.md`, `closeout.md`, optional agent notes/packets/handoffs |
| `full` | gated, high-risk, approval-heavy, or release work | `work.md`, approval records for real gates, evidence, review/release notes, closeout |

## Naming Rules

- Work summary: `work.md`.
- Agent notes: `agent-<role>-NNN.md` for human-readable specialist output when
  machine-readable handoff is unnecessary.
- Handoffs: `handoff-<stage>-<role>-NNN.json` only when machine-readable
  resume/audit/accountability is useful.
- Approvals: `approval-NNN.json` only for real gates.
- Evidence index: `evidence.md` unless a JSON evidence item is needed.
- Closeout: `closeout.md`, optionally backed by a closeout JSON object.
- Attempts are append-by-new-file when auditability matters; otherwise update
  the compact work/evidence notes.

## Jet Rule

Tiny work should leave no files by default. Lightweight work should not create
packets or handoffs unless they help portability. Full shape is reserved for
real risk, approvals, release, or multi-stage evidence.

Artifacts are a flight recorder, not a management UI. If a file will not help
continuation, evidence, review, or a real gate decision, do not create it.

For T1+ persisted work, once Maestro understands the task it should create or
update `work.md` without asking for separate artifact permission. That artifact
captures continuity only; it does not authorize product-code edits or high-risk
actions.

## Artifact Source Of Truth

Artifact files are a portable work record, not the primary product truth.
Product code, tests, canonical docs, `.codex`, `.agents`, and Maestro contracts
remain authoritative for runtime behavior.

`maestro/memory/` is the durable memory layer. Any future memory-root move
requires separate owner approval.
