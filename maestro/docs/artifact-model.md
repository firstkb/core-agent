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

## Source Of Truth Boundary

Target boundary:

- API/DB owns live operational state.
- `maestro/artifacts/` stores portable snapshots, handoffs, evidence, reports,
  and append-only attempt records.
- Artifact JSON files are exports or handoffs, not the primary mutable state.
- `.agent-cli` remains a bridge for current local artifact validation and import
  or export.
- `ai-memory` stores durable compressed memory, not live task state.

## Proposed Artifact Tree

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
```

## Core Files

### `brief.md`

Owner-facing work brief. Required only for large, module-sized, or high-risk
work.

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

Rules:

- required for task-tier and above;
- may be skipped for Tier 0 direct work;
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
maestro/artifacts/workspace/work/<work>/features/<feature>/tasks/<task>/
```

Migration should be through explicit import/export. Do not silently reinterpret
old artifact folders as new live state.
