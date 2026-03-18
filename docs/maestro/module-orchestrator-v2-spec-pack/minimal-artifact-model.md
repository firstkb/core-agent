---
doc_status: current
doc_scope: working_set
doc_type: artifact_model
canonical_for: module_orchestrator_artifact_model
---

# Module Orchestrator V2 Minimal Artifact Model

This document fixes the simplified target artifact structure for the next V2 iteration.

It intentionally replaces the heavier stage artifact model used in earlier V2 drafts.

The goal is to keep:

- one live owner-facing brief;
- one mutable machine-state file per module and feature;
- append-only attempt history where it pays off;
- no duplicated review artifacts.

Markdown authorship boundary:

- AI writes Markdown artifacts using canonical templates from `.codex/templates/`
- CLI writes mutable JSON state and copies AI-authored attempt `README.md` files into canonical paths
- CLI does not create seeded Markdown content

If this document conflicts with earlier V2 proposal details, treat this document as the preferred simplification direction.

---

## 1. Final Structure

```text
artifacts/<module>/
  brief.md
  status.json
  features/
    <feature>/
      README.md
      status.json
      stages/
        <stage>/
          attempt-001/
            handoff.json
            README.md
```

Example:

```text
artifacts/avatar-service-test-execution-v2-pilot/
  brief.md
  status.json
  features/
    restore-executable-npm-test/
      README.md
      status.json
      stages/
        research/
          attempt-001/
            handoff.json
            README.md
```

What is intentionally not present:

- no `brief-approved.md`
- no `feature-index.md`
- no `packet.md`
- no `review.json`
- no `review.md`
- no `attempts/` parent directory

Canonical template sources:

- module brief: `.codex/templates/module_orchestrator/brief.md.tmpl`
- feature root README: `.codex/templates/module_orchestrator/feature-readme.md.tmpl`

---

## 2. Core Principles

### 2.1. One live brief

- `brief.md` is the only module brief document.
- It is editable during discussion.
- After owner approval, it becomes frozen by process rule rather than by copying to a second markdown file.
- Approval and freeze are recorded in module `status.json`.

### 2.2. Feature packet is just `README.md`

- `features/<feature>/README.md` is the frozen feature packet.
- It is the main human-facing feature document.
- It is created from the approved decomposition inside `brief.md`.
- In the normal seed flow, `feature seed` allocates the feature root and `status.json`, then Maestro authors `README.md` in the same pass.
- Stopping after JSON-only seed is an exception that should happen only when the owner explicitly asks for a state-only transition.
- Frontmatter in feature `README.md` must not duplicate mutable lifecycle state.
- Feature lifecycle state belongs only in feature `status.json`.

### 2.3. Feature roster is ordered

- `module.status.json.features` is an ordered roster, not an unordered set.
- The order must match the owner-approved feature order in `brief.md`.
- If feature dependencies exist, dependency features must appear earlier than dependent features.

### 2.4. Feature execution is sequential

- The current Maestro model does not launch multiple features in parallel.
- Work proceeds one feature at a time.
- If later features depend on earlier ones, the dependent feature stays idle until the upstream feature reaches its accepted boundary or completes.

### 2.5. JSON is mutable machine state only

- only `status.json` files are mutable machine state;
- stage agents do not patch them directly;
- CLI owns JSON writes.

### 2.6. Attempt folders stay append-only

- each stage attempt gets its own folder:
  - `attempt-001`
  - `attempt-002`
  - `attempt-003`
- this is the cheapest clean retry history;
- there is no separate `attempts/` directory.

### 2.7. No separate review artifact

- the stage still submits `handoff.json`;
- the attempt `README.md` carries both:
  - the stage narrative;
  - the appended orchestrator decision block;
- the feature `status.json` stores the current/latest machine-readable decision.

Tradeoff:

- per-attempt machine-readable review history is not stored as a separate file;
- this keeps the pilot model smaller;
- if later we need explicit review-history artifacts, they can be added back deliberately.

---

## 3. File Responsibilities

## 3.1. Module Root

### `brief.md`

Responsibility:

- live owner-facing working brief;
- source for scope, non-goals, constraints, acceptance signals, and feature decomposition;
- optional insertion point for brief review feedback.

Lifecycle:

- editable during discussion;
- frozen after owner brief approval;
- after freeze, it is not edited silently.
- once frozen, it should still read as durable truth rather than a stale phase transcript.

Required sections:

```md
# Module Brief

## Request
## Goal
## Scope In
## Scope Out
## Constraints
## Approval Policy
## Acceptance Signals
## Observed Facts
## Confirmed Owner Decisions
## Provisional Decisions
## Open Questions
## Rationale
## Proposed Feature Set
## Feature Details
## Reviewer Notes
```

Rules:

- `Reviewer Notes` is optional until the brief review agent is used.
- Maestro must not write a self-review entry in this section.
- If the review agent writes notes, each note block must be explicitly marked.
- `brief.md` should capture durable scope, facts, decomposition, sequencing, and approval policy.
- `brief.md` should normalize the owner request into durable terms rather than copying transient lifecycle wording verbatim.
- each feature entry should include durable routing metadata:
  - `Platform`
  - `Target`
- `brief.md` must not encode transient lifecycle claims such as:
  - current phase labels
  - `not seeded`
  - `stay in discussion`
  - `the next step is ...`
  - similar time-bound status statements that become false after advancement
- if owner approval boundaries need to be stated, phrase them as durable policy:
  - `Feature seeding requires explicit owner approval`
  - not as current-state narration.
- the proposed feature set should carry the approved execution order and declared dependencies.
- each feature detail block should include an explicit launch rule when ordering or dependency gates matter.
- `Initial Stage` does not need to appear in the brief when the current runtime path already fixes the first stage separately.

Recommended marker format:

```md
### Grant | 2026-03-17T22:00:00Z | recommendation: revise
- Scope is still ambiguous around package boundaries.
- Acceptance signals do not yet define the expected implementation boundary.
```

Brief review agent naming:

- system name: `brief_auditor`
- human nickname: `Grant`

### `status.json` at module root

Responsibility:

- mutable machine state of the module lifecycle;
- owner approval gates;
- module roster of created features;
- current runtime action pointer.

Minimal fields:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution-v2-pilot",
  "phase": "discussion",
  "brief": {
    "path": "artifacts/avatar-service-test-execution-v2-pilot/brief.md",
    "approved": false,
    "frozen": false
  },
  "owner_approvals": {
    "brief": false,
    "execution": false
  },
  "features": [],
  "current_action": "awaiting_owner_input",
  "updated_at": "2026-03-17T00:00:00Z"
}
```

Field meanings:

- `schema_version`: JSON contract version.
- `module_id`: stable module slug.
- `feature_id`: stable lowercase kebab-case slug reused for the same task shape across repeated runs.
- `phase`: current module lifecycle phase.
- `brief.path`: canonical path to the module brief.
- `brief.approved`: whether owner approved the brief.
- `brief.frozen`: whether the brief is no longer editable.
- `owner_approvals.brief`: explicit owner approval for brief freeze.
- `owner_approvals.execution`: explicit owner approval to begin stage execution.
- `features`: ordered roster of created feature ids in owner-approved execution order.
- `current_action`: concise orchestrator runtime pointer.
- `updated_at`: last CLI write time.

Recommended module phases:

- `discussion`
- `awaiting_brief_approval`
- `brief_frozen`
- `ready_to_seed_features`
- `awaiting_execution_approval`
- `executing`
- `blocked`
- `done`
- `cancelled`

## 3.2. Feature Root

### `features/<feature>/README.md`

Responsibility:

- frozen feature packet;
- explains what the feature is, why it exists, and what bounded work it owns;
- primary human-facing document for all stage agents working on that feature.

Lifecycle:

- created from the approved decomposition in `brief.md`;
- authored immediately after the CLI seed step allocates the feature root;
- frozen after feature creation unless a later amendment model is explicitly introduced.
- frontmatter stays descriptive only and must not duplicate mutable lifecycle state.
- platform and target metadata should carry forward from the approved brief so stage agents can see the main owned surface immediately.

Required sections:

```md
# Feature

## Identity
## Platform
## Target
## Mission
## Why This Exists
## Scope In
## Scope Out
## Initial Stage
## Acceptance Signals
## Constraints
```

### `features/<feature>/status.json`

Responsibility:

- mutable machine state for one feature;
- tracks current stage, current attempt, latest submitted handoff, and latest orchestrator decision;
- stores the current/latest machine view, not the full structured history.

Minimal fields:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution-v2-pilot",
  "feature_id": "restore-executable-npm-test",
  "phase": "ready_for_stage",
  "readme_path": "artifacts/avatar-service-test-execution-v2-pilot/features/restore-executable-npm-test/README.md",
  "current_stage": null,
  "next_stage": "research",
  "active_attempt_id": null,
  "latest_attempt_id": null,
  "latest_submitted_handoff_ref": null,
  "last_reviewed_attempt_id": null,
  "last_reviewed_handoff_ref": null,
  "last_decision": null,
  "last_decision_reason": null,
  "blocked_reason": null,
  "updated_at": "2026-03-17T00:00:00Z"
}
```

Field meanings:

- `schema_version`: JSON contract version.
- `module_id`: owning module slug.
- `feature_id`: stable feature slug.
- prefer outcome-based slugs and avoid synonym drift across equivalent runs.
- `phase`: current feature lifecycle phase.
- `readme_path`: canonical path to the feature packet.
- `current_stage`: stage currently running or waiting for review, else `null`.
- `next_stage`: stage the feature should run next, else `null`.
- `active_attempt_id`: active attempt id while a stage is running, else `null`.
- `latest_attempt_id`: most recently allocated attempt id, else `null`.
- `latest_submitted_handoff_ref`: latest submitted `handoff.json`, else `null`.
- `last_reviewed_attempt_id`: last attempt id reviewed by orchestrator, else `null`.
- `last_reviewed_handoff_ref`: handoff path for the last reviewed attempt, else `null`.
- `last_decision`: latest orchestrator decision such as `accept`, `revise`, `block`, or `escalate_to_owner`, else `null`.
- `last_decision_reason`: concise latest decision explanation, else `null`.
- `blocked_reason`: reason for blocked state, else `null`.
- `updated_at`: last CLI write time.

Recommended feature phases:

- `seeded`
- `ready_for_stage`
- `stage_in_progress`
- `awaiting_review`
- `done`
- `blocked`

Why `last_reviewed_attempt_id` is needed:

- if `attempt-001` was reviewed as `revise` and `attempt-002` later starts,
  `latest_attempt_id` now points to `attempt-002`;
- without `last_reviewed_attempt_id`, the last decision loses its binding to the actual reviewed attempt.

## 3.3. Stage Attempt Root

### `features/<feature>/stages/<stage>/attempt-001/`

Responsibility:

- append-only record of one bounded execution attempt for one stage.

Why this folder stays:

- it keeps retry history clean;
- it prevents `handoff.json` overwrite;
- it avoids messy suffix patterns like `handoff-v2.json`.

### `handoff.json`

Responsibility:

- structured output of one stage attempt;
- machine-readable handoff from the stage agent to `module_orchestrator`.

Minimal fields:

```json
{
  "schema_version": 1,
  "module_id": "avatar-service-test-execution-v2-pilot",
  "feature_id": "restore-executable-npm-test",
  "stage": "research",
  "attempt_id": "attempt-001",
  "agent_id": "research_codebase",
  "result": "complete",
  "summary": "npm test fails before assertions because the tests import .js files while the package currently ships TypeScript source files only.",
  "evidence_refs": [
    "platform/packages/research-avatar-service/package.json",
    "platform/packages/research-avatar-service/test/avatar_service.test.js"
  ],
  "produced_artifact_refs": [
    "artifacts/avatar-service-test-execution-v2-pilot/features/restore-executable-npm-test/stages/research/attempt-001/README.md"
  ],
  "change_requests": [],
  "recommended_next_stage": "implementation",
  "created_at": "2026-03-17T00:00:00Z"
}
```

Field meanings:

- `schema_version`: JSON contract version.
- `module_id`: owning module slug.
- `feature_id`: owning feature slug.
- `stage`: stage slug such as `research` or `implementation`.
- `attempt_id`: exact attempt folder id.
- `agent_id`: stage agent system name.
- `result`: stage result such as `complete`, `blocked`, `failed`, or `cancelled`.
- `summary`: concise structured summary of the attempt outcome.
- `evidence_refs`: paths or references supporting the handoff summary.
- `produced_artifact_refs`: additional files produced by this attempt.
- `change_requests`: follow-up requests or clarifications from the stage agent.
- `recommended_next_stage`: downstream recommendation or `null`.
- `created_at`: handoff creation timestamp.

### `README.md` inside `attempt-001`

Responsibility:

- human-readable report of the attempt;
- combines the stage narrative and the final orchestrator decision in one file;
- replaces the old `report.md` plus `review.md` split.

Lifecycle:

- stage agent writes the initial report body;
- orchestrator or CLI appends the final decision block after review.

Required sections:

```md
# Stage Attempt

## Identity
## Task
## Observed Facts
## Analysis
## Evidence
## Recommended Next Stage
## Orchestrator Decision
```

Rules:

- `Orchestrator Decision` may be absent until review happens.
- After review, the decision block is appended to the same file.

Recommended decision block:

```md
## Orchestrator Decision
- Decision: accept
- Reason: Research is sufficient to proceed to implementation.
- Next Stage: implementation
- Reviewed At: 2026-03-17T22:00:00Z
```

---

## 4. Creation Order

Recommended creation order:

1. create module root with `brief.md` and module `status.json`;
2. owner and `module_orchestrator` iterate on `brief.md`;
3. optional `brief_auditor` / `Grant` inserts clearly marked reviewer notes into `brief.md`;
4. owner approves the brief;
5. freeze `brief.md` by process rule and by module status fields;
6. create `features/<feature>/README.md` and feature `status.json` directly from the approved brief decomposition;
7. allocate `attempt-001/` only when the stage starts;
8. stage agent writes `handoff.json` and attempt `README.md`;
9. orchestrator reviews the handoff;
10. append the orchestrator decision block to attempt `README.md`;
11. update feature and module `status.json`.

---

## 5. Illegal Simplifications

The following shortcuts should still be treated as wrong:

- removing `attempt-001/` and overwriting stage files in place;
- storing all decision history only in mutable module `status.json`;
- silently editing frozen `brief.md` or feature `README.md` after approval;
- writing unmarked `Grant` notes into `brief.md` as if they were owner-approved content;
- reintroducing `review.md` or `review.json` without a deliberate new reason;
- bringing back `brief-approved.md` just to duplicate `brief.md` without a real revisioning need.
