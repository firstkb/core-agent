---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: routing_tier_contract
lang: en
---

# Maestro vNext Routing Tier Contract

## Purpose

This document defines how Maestro chooses the lightest sufficient route for an
owner request.

The goal is to keep Maestro fast for small work while preserving enough
structure for feature, module-sized, high-risk, and release work.

## Core Rule

Maestro must choose the cheapest route that preserves correctness, evidence,
approval gates, and handoff quality.

Do not create a work brief, feature decomposition, stage attempts, snapshots, or
multiple agent runs unless the request actually needs them.

## Tier Summary

| Tier | Use When | `route_tier` | `artifact_shape` | Formal State |
|---|---|---|---|---|
| 0 | Tiny inline work | `direct` | `none` | no |
| 1 | Small bounded work with optional durable record | `task` | `lightweight` | optional |
| 2 | Work needs stage handoff, verification, or review | `task` | `staged_task` | yes |
| 3 | Work needs feature decomposition | `feature` | `feature_work` | yes |
| 4A | Module-sized initiative | `module_sized_work` | `feature_work` or `full` | yes |
| 4B | High-risk, release, security, migration, or production-impacting work | `high_risk` | `full` | yes |

## Decision Inputs

Maestro should classify the owner request using these inputs:

- scope size;
- number of touched surfaces;
- uncertainty about the code path;
- need for decomposition;
- need for specialist agents;
- risk level;
- approval requirements;
- verification requirements;
- durable handoff requirements;
- memory/docs impact;
- release or production impact.

## Routing Matrix

| Signal | Recommended Tier |
|---|---|
| One obvious low-risk edit, no durable handoff needed | Tier 0 |
| One bounded edit, useful to record result | Tier 1 |
| Needs tests, browser smoke, Storybook, CI, review, or handoff | Tier 2 |
| Needs research before implementation | Tier 2 or Tier 3 |
| Needs multiple tasks under one owner goal | Tier 3 |
| Needs feature decomposition or dependency ordering | Tier 3 |
| Needs owner-approved brief before execution | Tier 4A |
| Auth, tenancy, permissions, secrets, migrations, security, release, or deploy | Tier 4B |
| Touches durable docs or `ai-memory` policy | Add `memory_audit` / Archivist |
| Needs production-impacting action | Add Release and explicit release approval |

## Tier 0: Direct Inline

Use when all are true:

- scope is tiny;
- risk is low;
- no separate agent context is useful;
- no durable handoff is needed;
- verification can be summarized in the final response.

Default path:

```text
Maestro
  -> direct execution or Mason-lite
  -> focused check
  -> final response
```

State and artifacts:

- `state_required = false`
- `artifact_shape = none`
- no persisted work folder by default

Disallowed:

- high-risk changes;
- migrations;
- auth/session/tenant isolation changes;
- release or deploy actions;
- multi-surface work with unclear dependencies.

Escalate to Tier 1 or Tier 2 when evidence or review becomes useful.

## Tier 1: Lightweight Task

Use when the work is still small but a durable record is useful.

Default path:

```text
Maestro
  -> task packet
  -> Mason or current chat
  -> focused checks
  -> closeout
```

State and artifacts:

- `state_required = optional`
- `route_tier = task`
- `artifact_shape = lightweight`

Default artifact shape:

```text
work/<work_id>/
  task.md
  closeout.md
  evidence/
```

Typical examples:

- small UI fix that should be recorded;
- env example update;
- focused docs update;
- small backend endpoint correction with straightforward verification.

Escalate to Tier 2 when stage attempts, independent verification, or review are
needed.

## Tier 2: Staged Task

Use when the work is bounded but needs explicit stage execution.

Default path:

```text
Maestro
  -> task packet
  -> Charlie when research is useful
  -> Mason
  -> Scout when verification is material
  -> Lens when review is material
  -> Scribe closeout when durable closeout is useful
```

State and artifacts:

- `state_required = true`
- `route_tier = task`
- `artifact_shape = staged_task`

Default stages:

- `research` only when needed;
- `implementation`;
- `verification` when needed;
- `review` when needed;
- `closeout`.

Default artifact shape:

```text
work/<work_id>/
  task.md
  stages/<stage_name>/attempt-001/
    README.md
    handoff.json
    evidence/
  closeout.md
```

Typical examples:

- visible UI work with browser evidence;
- backend fix that needs tests;
- Storybook coverage work;
- scoped refactor with review risk.

Escalate to Tier 3 when one owner goal needs multiple coordinated tasks or
feature decomposition.

## Tier 3: Feature Work

Use when one owner goal needs decomposition into feature slices or multiple
tasks.

Default path:

```text
Maestro
  -> feature/task plan
  -> Charlie when code path or dependency order is unclear
  -> Mason tasks
  -> Scout verification
  -> Lens review
  -> Scribe closeout
  -> Archivist when durable memory/docs are impacted
```

State and artifacts:

- `state_required = true`
- `route_tier = feature`
- `artifact_shape = feature_work`

Default artifact shape:

```text
work/<work_id>/
  brief.md
  features/<feature_id>/
    README.md
    tasks/<task_id>/
      task.md
      stages/<stage_name>/attempt-001/
        README.md
        handoff.json
        evidence/
  closeout.md
```

Use feature decomposition only when it removes ambiguity. Small work should
stay in Tier 1 or Tier 2.

Escalate to Tier 4A when the owner goal is module-sized and requires explicit
brief approval before execution.

## Tier 4A: Module-Sized Work

Use for large initiatives that require owner-approved scope, decomposition, and
sequencing.

Default path:

```text
Maestro
  -> work brief
  -> Charlie
  -> feature/task decomposition
  -> Grant
  -> owner brief approval
  -> owner execution approval
  -> staged execution
  -> Scribe closeout
```

State and artifacts:

- `state_required = true`
- `route_tier = module_sized_work`
- `artifact_shape = feature_work` by default;
- `artifact_shape = full` when snapshots, approvals, or audit trail must be
  portable.

Required approvals:

- `brief`
- `execution`

Typical examples:

- build a new product module;
- create AI chat capability across FE/BE;
- introduce a new product workflow with multiple dependencies.

Escalate to Tier 4B when the work includes security, migration, tenancy,
secrets, release, or production impact.

## Tier 4B: High Risk

Use for any work where a wrong change can compromise security, tenant
isolation, data integrity, or production stability.

Default path:

```text
Maestro
  -> Charlie
  -> Grant
  -> owner/security/migration approval
  -> Mason
  -> Scout with required gates
  -> Lens
  -> Release when deploy is in scope
  -> Scribe closeout
  -> Archivist when memory/docs are impacted
```

State and artifacts:

- `state_required = true`
- `route_tier = high_risk`
- `artifact_shape = full`

Required approvals depend on risk type:

- `high_risk_implementation`
- `security`
- `migration`
- `release`
- `memory_update`

Required evidence depends on risk type:

- command output;
- tests;
- CI;
- security notes;
- migration notes;
- review notes;
- approval records;
- release or rollback notes.

High-risk work must not run as Tier 0 or Tier 1.

## Stage Selection

| Stage | Use When |
|---|---|
| `planning` | Maestro needs to shape scope before execution |
| `research` | code path, dependencies, or risks are unclear |
| `brief_audit` | a work brief or high-risk plan needs Grant |
| `implementation` | product code, docs, tests, or artifacts change |
| `verification` | checks or visual/browser/CI evidence matter |
| `review` | independent diff/evidence/acceptance review is useful |
| `release` | deployment, production promotion, or rollback is in scope |
| `closeout` | durable result/evidence summary is useful |
| `memory_audit` | durable docs or `ai-memory` may need update |

## Agent Selection

| Agent | Use When |
|---|---|
| Charlie | research is useful or facts are uncertain |
| Grant | brief/risk/dependency plan needs audit before approval |
| Mason | implementation is needed |
| Scout | verification is non-trivial or independent checks are useful |
| Lens | read-only review is material |
| Release | deploy/release/promotion is in scope |
| Scribe | durable closeout artifact is useful |
| Archivist | docs or `ai-memory` consistency may be impacted |

## Escalation Rules

Escalate the route when:

- risk is higher than first classified;
- more than one product surface is touched;
- implementation needs research before safe editing;
- a second specialist agent becomes useful;
- evidence cannot be summarized confidently in the final response;
- approval is needed;
- the owner asks for a durable run record.

## De-Escalation Rules

De-escalate the route when:

- decomposition would not change execution quality;
- feature folders would contain only one trivial task;
- stages would create ceremony without improving verification;
- evidence can be captured in a compact closeout;
- there is no memory/docs impact.

## Required Intake Output

At intake Maestro should report:

- `route_tier`;
- `artifact_shape`;
- whether state is required;
- selected stages;
- selected agents;
- approvals required;
- evidence required;
- next allowed action.

This intake output should map directly to
`maestro/contracts/orchestration-plan.schema.json`.
