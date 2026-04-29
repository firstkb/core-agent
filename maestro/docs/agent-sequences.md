---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: agent_sequences
lang: en
---

# Maestro Agent Sequences

## Purpose

This document defines the default execution recipes Maestro may choose after
routing a request. These sequences are recipes, not mandatory ceremony.
Maestro should skip optional agents when they do not improve correctness,
evidence, approval safety, or handoff quality.

## Sequence Rules

- Maestro is always the lifecycle owner.
- Maestro runs inline in the owner-facing thread.
- Specialist agents receive bounded packets.
- Specialist agents recommend next actions but do not advance lifecycle alone.
- Owner approvals happen at explicit gates.
- Scribe records closeout; Archivist audits docs and `ai-memory` only when
  durable memory is impacted.
- Atlas remains independent and outside the formal chain.

## Canonical Sequences

| Scenario | Route Tier | Default Sequence | Required Gates |
|---|---|---|---|
| Tiny direct | T0 Direct Inline | Maestro | focused check |
| Lightweight task | T1 Lightweight Task | Maestro -> Mason -> Scribe optional | closeout when persisted |
| Staged task | T2 Staged Task | Maestro -> Mason -> Scout optional -> Lens optional -> Scribe | evidence before closeout |
| UI task | T2 or T3 | Maestro -> Charlie optional -> Mason -> Scout/browser -> Lens -> Scribe | route, viewport, states, visual notes |
| Feature work | T3 Feature Work | Maestro -> Charlie -> Maestro plan -> Grant optional -> Mason -> Scout -> Lens -> Scribe -> Archivist optional | approval when scope/risk requires it |
| Module-sized work | T4A Module-Sized Work | Maestro -> Charlie -> Maestro brief -> Grant -> Owner approval -> staged execution -> Scribe -> Archivist optional | owner-approved brief |
| High-risk work | T4B High Risk | Maestro -> Charlie -> Grant -> Owner/security approval -> Mason -> Scout -> Lens -> Owner/release approval optional -> Release optional -> Scribe -> Archivist optional | high-risk approvals and evidence |
| Docs/memory work | T1-T3 | Maestro -> Mason or current chat -> Scribe optional -> Archivist | docs/memory consistency check |
| Release work | T4B when production-impacting | Maestro -> Charlie optional -> Grant optional -> Owner release approval -> Release -> Scout -> Scribe | release approval and rollback notes |

## Tiny Direct

Use when work is obvious, low-risk, and can be completed in the current thread.

```text
Maestro
  -> focused check
  -> final response
```

No persisted artifact is required by default. Escalate to T1 when the owner
wants a durable record or when evidence should survive the chat.

## Lightweight Task

Use when one bounded change benefits from a task packet or closeout but does not
need staged handoff.

```text
Maestro
  -> Mason
  -> focused checks
  -> Scribe optional
```

Scout is optional when checks are simple enough for Mason. Lens is optional when
independent review would not materially reduce risk.

## Staged Task

Use when the task needs explicit stages, verification, review, or portable
handoff evidence.

```text
Maestro
  -> Mason
  -> Scout
  -> Lens
  -> Scribe
```

Charlie may run before Mason when the code path is unclear.

## UI Task

Use for visible frontend changes, Storybook work, interaction states, or browser
verification.

```text
Maestro
  -> Charlie optional
  -> Mason with ui-designer skill when design decisions matter
  -> Scout with browser or visual review
  -> Lens
  -> Scribe
```

Required evidence:

- route checked;
- viewport checked;
- relevant states checked;
- screenshot or visual notes;
- visual issues found and fixed, or remaining visual risks recorded.

## Feature Work

Use when one owner goal needs decomposition into feature slices or coordinated
tasks.

```text
Maestro
  -> Charlie
  -> Maestro plan
  -> Grant optional
  -> Mason per task
  -> Scout
  -> Lens
  -> Scribe
  -> Archivist optional
```

Owner approval is required when the plan freezes scope, affects high-risk
surfaces, or introduces meaningful dependency ordering.

## Module-Sized Work

Use when the request is large enough to need an owner-approved brief before
execution.

```text
Maestro
  -> Charlie
  -> Maestro brief
  -> Grant
  -> Owner approval
  -> staged feature execution
  -> Scribe
  -> Archivist optional
```

No implementation stage starts until the brief gate is satisfied.

## High-Risk Work

Use for auth, tenancy, permissions, migrations, secrets, production deployment,
release, or other irreversible work.

```text
Maestro
  -> Charlie
  -> Grant
  -> Owner/security approval
  -> Mason
  -> Scout
  -> Lens
  -> Owner/release approval optional
  -> Release optional
  -> Scribe
  -> Archivist optional
```

High-risk work must not run as T0 or T1. It must record approval, evidence,
residual risk, and rollback/recovery notes when release is in scope.
