---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: artifact_model
lang: en
---

# Maestro vNext Artifact Model

## Design Goal

Maestro artifacts are compact working records for native human-agent work.

They should feel closer to Atlas-style active notes than to a project-management
tree. Maestro should create only the files that help the next decision, handoff,
evidence, or closeout.

## Source Of Truth Boundary

Target boundary:

- Native Maestro conversation and active repository files own live work context.
- `maestro/artifact/active/` stores compact records for active work.
- `maestro/artifact/archive/` stores completed, cancelled, or frozen work.
- Artifact JSON files are packets, handoffs, evidence indexes, or optional
  snapshots, not primary mutable state.
- `ai-memory/` remains durable compressed memory until the accepted Maestro
  memory migration moves it under `maestro/memory/`.

## Active And Archive Layout

Canonical layout:

```text
maestro/artifact/
  active/
    YYYY-MM-DD-<work-slug>/
      intent.md
      plan.md
      task.md
      packet.md
      handoff-charlie-001.json
      handoff-mason-001.json
      evidence.md
      closeout.md
  archive/
    YYYY-MM-DD-<work-slug>/
      ...
```

`active/` may contain multiple active work folders. Each folder represents one
owner request or one meaningful work slice.

`archive/` uses the same folder name after closeout, cancellation, or freeze.
Archiving should be a simple move from `active/<work-slug>/` to
`archive/<work-slug>/`.

Do not confuse:

- `maestro/artifact/archive/` = completed Maestro work records;
- `maestro/archive/` = provenance copies of retired roles or skills.

## Naming Rule

Preferred work folder:

```text
YYYY-MM-DD-<work-slug>
```

Use a plain `<work-slug>` only for short-lived local work where date-based
archive naming adds no value.

## Jet Rule

Do not create every file for every request.

The full file list is a capability, not the default shape. A tiny task may leave
only a final response. A lightweight task may use only `intent.md` and
`closeout.md`. A staged task may add `packet.md`, handoffs, and `evidence.md`.

## Artifact Shapes By Route Tier

### Tier 0: Direct Inline

Use for tiny work that completes in the current chat and does not need durable
run state.

Default artifact shape:

```text
no persisted artifact folder
```

Allowed only when closeout evidence can stay in the final response.

### Tier 1: Lightweight Task

Use for small work that benefits from a portable record but does not need staged
handoff.

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  intent.md
  task.md
  closeout.md
```

`task.md` may be skipped when `intent.md` is enough to preserve context.

### Tier 2: Staged Task

Use when a task needs one or more explicit handoffs, verification, review, or
portable evidence.

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  intent.md
  plan.md
  task.md
  packet.md
  handoff-<role>-001.json
  evidence.md
  closeout.md
```

Add additional handoffs with incrementing suffixes:

```text
handoff-charlie-001.json
handoff-mason-001.json
handoff-scout-001.json
handoff-lens-001.json
```

### Tier 3: Feature Work

Use when one owner goal needs decomposition into slices or coordinated tasks.

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  intent.md
  brief.md
  plan.md
  task.md
  packet.md
  handoff-<role>-001.json
  evidence.md
  closeout.md
```

Keep decomposition inside `plan.md` or `brief.md`. Do not create nested
`features/` and `tasks/` directories unless the owner explicitly chooses a
larger artifact shape.

### Tier 4A: Module-Sized Work

Use when work is module-sized, approval-heavy, or needs a durable owner-approved
brief.

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  intent.md
  brief.md
  plan.md
  approval.md
  task.md
  packet.md
  handoff-<role>-001.json
  evidence.md
  closeout.md
```

Optional files:

- `snapshot.json` when a portable context export is useful;
- `review.md` when a human-readable review record is clearer than a handoff;
- `release.md` when release is in scope.

### Tier 4B: High-Risk Work

Use when work touches auth, tenancy, permissions, migrations, secrets, release,
deployment, or other irreversible or security-sensitive behavior.

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  intent.md
  brief.md
  plan.md
  approval.md
  task.md
  packet.md
  handoff-<role>-001.json
  evidence.md
  review.md
  release.md
  closeout.md
```

High-risk work must capture approvals, evidence, residual risks, and release or
rollback notes when production-impacting action is in scope.

## Core Files

Detailed per-file contracts live in `artifact-file-contract.md`.

- `intent.md`: owner request, intent mode, route decision, and current goal.
- `brief.md`: owner-approved scope for feature, module-sized, or high-risk work.
- `plan.md`: current adaptive plan and next useful action.
- `task.md`: bounded execution packet for one work item or slice.
- `packet.md`: ready-to-launch packet for one specialist agent or stage.
- `handoff-<role>-NNN.json`: machine-readable specialist result.
- `evidence.md`: checks, links, screenshots, logs, and evidence notes.
- `approval.md`: gate requests and owner/security/release decisions.
- `review.md`: human-readable review findings when needed.
- `release.md`: release, deployment, and rollback notes.
- `closeout.md`: final result, evidence, residual risks, and next action.
- `snapshot.json`: optional context export, not live mutable state.

## Archive Rule

At closeout, cancellation, or freeze:

1. finish `closeout.md` or add a cancellation/freeze note;
2. ensure evidence and approvals are linked;
3. move the folder from `active/` to `archive/`;
4. update durable memory only when the result has future value.

Tiny T0 work may skip this entirely.

## Compatibility With Current Runtime

Current repository runtime still uses existing module/feature artifacts outside
this proposal. Maestro vNext should not silently reinterpret old artifact
folders as new active work.

Migration must be explicit and owner-approved.
