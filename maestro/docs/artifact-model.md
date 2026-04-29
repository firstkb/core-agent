---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: artifact_model
lang: en
---

# Maestro vNext Artifact Model

## Design Goal

The current Maestro artifact model is intentionally minimal and local. Maestro
vNext keeps its strongest properties while making work, features, tasks,
evidence, approvals, and agent runs first-class for Cockpit and future cloud
workers.

The artifact model is intentionally tiered. Maestro should create only the
smallest artifact shape that the selected route tier needs.

## Source Of Truth Boundary

Target boundary:

- API/DB owns live operational state.
- `maestro/artifacts/` stores portable snapshots, handoffs, evidence, reports,
  and append-only attempt records.
- Artifact JSON files are exports or handoffs, not the primary mutable state.
- `.agent-cli` remains a bridge for current local artifact validation and import
  or export.
- `ai-memory` stores durable compressed memory, not live task state.

## Jet Rule

Do not create the full tree for every request.

Maestro should expand artifacts only when the work needs the extra structure.
The full hierarchy is a capability, not the default runtime shape.

## Artifact Shapes By Route Tier

### Tier 0: Direct Inline

Use for tiny work that completes in the current chat and does not need durable
run state.

Default artifact shape:

```text
no persisted artifact tree
```

Allowed only when closeout evidence can stay in the final response.

### Tier 1: Direct With Lightweight Record

Use for small work that benefits from a portable record but does not need stage
attempts.

Default artifact shape:

```text
maestro/artifacts/workspace/work/<work_id>/
  task.md
  closeout.md
  evidence/
```

### Tier 2: Staged Task

Use when a task needs one or more explicit stages, agent handoff, verification,
or review.

Default artifact shape:

```text
maestro/artifacts/workspace/work/<work_id>/
  task.md
  stages/<stage_name>/
    attempt-001/
      README.md
      handoff.json
      evidence/
  closeout.md
```

### Tier 3: Feature Work

Use when work needs decomposition into one or more feature slices.

Default artifact shape:

```text
maestro/artifacts/workspace/work/<work_id>/
  brief.md
  features/<feature_id>/
    README.md
    tasks/<task_id>/
      task.md
      stages/<stage_name>/
        attempt-001/
          README.md
          handoff.json
          evidence/
  closeout.md
```

### Tier 4: Full Or High-Risk Work

Use when work is module-sized, high-risk, approval-heavy, release-related, or
needs portable snapshots.

Expanded artifact shape:

```text
maestro/artifacts/workspace/
  repository.snapshot.json
  work/<work_id>/
    brief.md
    work.snapshot.json
    features/<feature_id>/
      README.md
      feature.snapshot.json
      tasks/<task_id>/
        task.md
        task.snapshot.json
        packet.md
        stages/<stage_name>/
          attempt-001/
            README.md
            handoff.json
            evidence/
              evidence-index.json
              screenshots/
              logs/
              reports/
        approvals/
        closeout.md
```

Snapshots are optional exports from API/DB. They are not required for normal
small work.

## Core Files

Detailed per-file contracts live in `artifact-file-contract.md`.

### `brief.md`

Owner-facing work brief. Required only for feature, module-sized, high-risk, or
approval-heavy work.

Rules:

- durable scope and decomposition belong here;
- transient lifecycle state does not;
- owner approval freezes the brief by process and state.

### `README.md` at Feature Root

Frozen feature packet generated from the approved work plan.

Rules:

- explains the feature mission and bounds;
- keeps feature metadata descriptive;
- mutable lifecycle state stays in DB/API and exported snapshots.

### `task.md`

Human-readable task packet.

- required for persisted work;
- may be skipped for Tier 0 direct inline work;
- must include scope, acceptance, constraints, risk level, stage plan, checks,
  evidence expectations, and do-not-change boundaries.

### `packet.md`

Agent launch packet for the next stage or specialist agent.

Rules:

- may be regenerated for each stage;
- must be scoped to the assigned agent;
- must not grant authority outside the task.

### `README.md` inside an Attempt

Human-readable stage attempt report.

Rules:

- written by the stage agent or closeout role;
- receives an appended orchestrator decision after review;
- remains append-only once submitted.

### `handoff.json`

Machine-readable stage output.

Rules:

- submitted once per attempt;
- validated against the stage handoff contract;
- points to evidence references and changed files;
- recommends the next stage without advancing lifecycle.

### `evidence-index.json`

Index of evidence attached to an attempt.

Rules:

- records screenshots, logs, command outputs, CI links, browser notes, review
  notes, approvals, and external links;
- evidence files should be immutable after attachment.

## Compatibility With Current Runtime

Current runtime:

```text
artifacts/<module>/
  brief.md
  status.json
  features/<feature>/README.md
  features/<feature>/status.json
  features/<feature>/stages/<stage>/attempt-001/
```

Target runtime:

```text
maestro/artifacts/workspace/work/<work>/
```

Migration should be through explicit import/export. Do not silently reinterpret
old artifact folders as new live state.
