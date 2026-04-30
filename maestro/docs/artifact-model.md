---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: artifact_model
lang: en
---

# Maestro vNext Artifact Model

## Design Goal

Maestro artifacts are compact work records for native human-agent engineering
work. They preserve intent, decisions, handoffs, evidence, approvals, and
closeout without becoming a project-management tree.

Create only the files that help the next decision, delegation, evidence trail,
or archive handoff.

## Active And Archive Layout

```text
maestro/artifact/
  active/
    YYYY-MM-DD-<work-slug>/
      intent.md
      plan.md
      task.md
      packet.md
      approval-001.json
      handoff-research-charlie-001.json
      handoff-implementation-mason-001.json
      handoff-verification-scout-001.json
      evidence.md
      closeout.md
  archive/
    YYYY-MM-DD-<work-slug>/
      ...
```

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
| `lightweight` | small persisted work | `intent.md`, optional `task.md`, `closeout.md` |
| `staged` | one or more delegated or evidence-heavy stages | `intent.md`, `task.md`, `packet.md`, handoff JSON, `evidence.md`, `closeout.md` |
| `multi_step` | one owner goal needs several linear steps or dependencies | `intent.md`, `plan.md`, task/packet/handoff/evidence/closeout files |
| `full` | gated, high-risk, approval-heavy, or release work | plan, approvals, packets, handoffs, evidence, review/release notes, closeout |

## Naming Rules

- Handoffs: `handoff-<stage>-<role>-NNN.json`.
- Approvals: `approval-NNN.json`.
- Evidence index: `evidence.md` unless a JSON evidence item is needed.
- Closeout: `closeout.md`, optionally backed by a closeout JSON object.
- Attempts are append-by-new-file; do not overwrite previous handoffs.

## Jet Rule

Tiny work should leave no files by default. Lightweight work should not create
packets or handoffs unless they help portability. Full shape is reserved for
real risk, approvals, release, or multi-stage evidence.

## Artifact Source Of Truth

Artifact files are a portable work record, not the primary product truth.
Product code, tests, canonical docs, `.codex`, `.agents`, and Maestro contracts
remain authoritative for runtime behavior.

`maestro/memory/` is the durable memory layer. Any future memory-root move
requires separate owner approval.
