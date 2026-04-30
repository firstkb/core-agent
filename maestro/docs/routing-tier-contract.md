---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: routing_tier_contract
lang: en
---

# Maestro vNext Routing Tier Contract

## Purpose

This document defines how Maestro chooses the lightest sufficient route for an
owner request.

Routing tiers are internal operating mechanics. Maestro should not expose route
tier labels to the owner by default. Owner-facing communication should describe
the understood goal, recommended first step, real risks, evidence expectation,
and what will not be touched yet.

The goal is to keep Maestro fast for small work while preserving enough
structure for multi-step, approval-gated, high-risk, and release work.

## Core Rule

Maestro must choose the cheapest route that preserves correctness, evidence,
approval gates, and handoff quality.

Do not create a work brief, nested decomposition, stage attempts, snapshots, or
multiple agent runs unless the request actually needs them.

If the task is not fully understood, clarify before execution. Do not pick a
route to avoid asking a product or acceptance question.

Arrow diagrams in this document are shorthand for possible adaptive moves. They
are not automatic chains that must run end to end.

## Tier Summary

| Tier | Use When | `route_tier` | `artifact_shape` | Durable Record |
|---|---|---|---|---|
| 0 | Tiny inline work | `T0_inline` | `none` | no |
| 1 | Small bounded work with optional durable record | `T1_task` | `lightweight` | optional |
| 2 | Work needs stage handoff, verification, or review | `T2_staged` | `staged` | yes |
| 3 | One owner goal needs several linear steps | `T3_multi_step` | `multi_step` | yes |
| 4 | High-risk, approval-gated, release, migration, or production-impacting work | `T4_gated` | `full` | yes |

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
| Needs multiple steps or dependency ordering inside one owner goal | Tier 3 |
| Needs owner-approved brief before execution | Tier 4 |
| Auth, tenancy, permissions, secrets, migrations, security, release, or deploy | Tier 4 |
| Touches durable docs or memory policy | Add `memory` / Archivist |
| Needs production-impacting action | Add Release and explicit release approval |

## Tier 0: Direct Inline

Use when all are true:

- scope is tiny;
- risk is low;
- no separate agent context is useful;
- no durable handoff is needed;
- verification can be summarized in the final response.

Typical adaptive moves:

```text
Maestro
  -> direct execution or Mason-lite
  -> focused check
  -> final response
```

State and artifacts:

- `record_required = false`
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

Typical adaptive moves:

```text
Maestro
  -> compact work note when persisted
  -> Mason or current chat
  -> focused checks
  -> closeout
```

State and artifacts:

- `record_required = optional`
- `route_tier = T1_task`
- `artifact_shape = lightweight`

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  work.md
  closeout.md
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

Typical adaptive moves:

```text
Maestro
  -> scoped assignment
  -> Charlie when research is useful
  -> Mason
  -> Scout when verification is material
  -> Lens when review is material
  -> Scribe closeout when durable closeout is useful
```

State and artifacts:

- `record_required = true`
- `route_tier = T2_staged`
- `artifact_shape = staged`

Default stages:

- `research` only when needed;
- `implementation`;
- `verification` when needed;
- `review` when needed;
- `closeout`.

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  work.md
  evidence.md
  closeout.md
  agent-<role>-001.md or handoff-<stage>-<role>-001.json only when useful
```

Typical examples:

- visible UI work with browser evidence;
- backend fix that needs tests;
- Storybook coverage work;
- scoped refactor with review risk.

Escalate to Tier 3 when one owner goal needs multiple coordinated linear steps.

## Tier 3: Multi-Step Work

Use when one owner goal needs several coordinated steps, slices, or dependencies
but does not require a high-risk or release gate.

Typical adaptive moves:

```text
Maestro
  -> work plan
  -> Charlie when code path or dependency order is unclear
  -> Mason tasks
  -> Scout verification
  -> Lens review
  -> Scribe closeout
  -> Archivist when durable memory/docs are impacted
```

State and artifacts:

- `record_required = true`
- `route_tier = T3_multi_step`
- `artifact_shape = multi_step`

Default artifact shape:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
  work.md
  evidence.md
  closeout.md
  agent notes, packets, or handoffs only when useful
```

Keep all decomposition inside `work.md` unless the owner explicitly asks for a
larger product structure or a separate expanded `plan.md` improves
continuation. Small work should stay in Tier 1 or Tier 2.

Escalate to Tier 4 when the owner goal requires explicit approval before
execution, touches high-risk surfaces, or includes release/deploy work.

## Tier 4: Gated Work

Use for high-risk, release, production-impacting, destructive, memory migration,
runtime restore, or owner-approval-gated work.

Typical adaptive moves:

```text
Maestro
  -> work brief
  -> Charlie
  -> linear work plan
  -> Grant
  -> owner approval
  -> staged execution
  -> Scout/Lens as needed
  -> Scribe closeout
```

State and artifacts:

- `record_required = true`
- `route_tier = T4_gated`
- `artifact_shape = full`

Required approvals:

- owner decision when a plan/brief must be accepted;
- owner decision when execution crosses a real product/risk boundary;
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

Typical examples:

- auth, sessions, tenant isolation, permissions, secrets, or billing changes;
- migrations or destructive operations;
- release, deploy, workflow dispatch, or production-impacting work;
- runtime restore or memory-root migration;
- owner-approved large work where execution must stop at a gate.

Gated work must not run as Tier 0 or Tier 1.

## Stage Selection

| Stage | Use When |
|---|---|
| `planning` | Maestro needs to shape scope before execution |
| `research` | code path, dependencies, or risks are unclear |
| `audit` | a work brief or high-risk plan needs Grant |
| `implementation` | product code, docs, tests, or artifacts change |
| `verification` | checks or visual/browser/CI evidence matter |
| `review` | independent diff/evidence/acceptance review is useful |
| `release` | deployment, production promotion, or rollback is in scope |
| `closeout` | durable result/evidence summary is useful |
| `memory` | durable docs or memory may need update |

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
| Archivist | docs or memory consistency may be impacted |

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
- nested decomposition would contain only one trivial task;
- stages would create ceremony without improving verification;
- evidence can be captured in a compact closeout;
- there is no memory/docs impact.

## Required Intake Output

Internally at intake Maestro should determine:

- `route_tier`;
- `artifact_shape`;
- whether a durable record is required;
- selected stages;
- selected agents;
- approvals required;
- evidence required;
- next allowed action.

Owner-facing output should not dump this list by default. It should compress it
into a Quiet Decision Frame:

- what Maestro understood;
- recommended first step;
- real risks or owner decisions;
- what Maestro will handle internally;
- evidence expectation;
- what is not touched yet.

The internal output may still map to
`maestro/contracts/orchestration-plan.schema.json` when machine-readable
planning is useful.
