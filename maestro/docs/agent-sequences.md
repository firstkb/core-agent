---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: agent_sequences
lang: en
---

# Maestro Agent Sequences

## Purpose

This document defines execution recipes Maestro may choose after routing a
request. These recipes are not automatic chains.

Maestro calls specialists one step at a time through the adaptive loop. It
should skip optional agents when they do not improve correctness, evidence,
approval safety, or handoff quality.

## Sequence Rules

- Maestro is always the lifecycle owner.
- Maestro runs inline in the owner-facing thread.
- Specialist agents receive bounded packets.
- Specialist agents recommend next actions but do not advance lifecycle alone.
- Owner approvals happen at explicit gates.
- Scribe records closeout; Archivist audits docs and durable memory only when
  memory is impacted.
- Atlas remains independent and outside the formal chain during transition; it
  is archived after Maestro acceptance unless the owner keeps it separately.

## Sequence Recipes

| Scenario | Route Tier | Useful Specialist Moves | Required Gates |
|---|---|---|---|
| Tiny direct | T0 Direct Inline | Maestro inline | focused check |
| Lightweight task | T1 Lightweight Task | Mason only when inline work is not enough; Scribe optional | closeout when persisted |
| Staged task | T2 Staged Task | Mason, then Scout or Lens only when evidence/review matters; Scribe when persisted | evidence before closeout |
| UI task | T2 or T3 | Charlie optional, Mason with UI skill, Scout/browser, Lens only when useful | route, viewport, states, visual notes |
| Feature work | T3 Feature Work | Charlie for unknowns, Grant for plan risk, Mason per slice, Scout/Lens/Scribe as needed | approval when scope/risk requires it |
| Module-sized work | T4A Module-Sized Work | Charlie, Grant, owner approval, then adaptive staged slices | owner-approved brief |
| High-risk work | T4B High Risk | Charlie, Grant, owner/security approval, Mason, Scout, Lens, Release only if approved | high-risk approvals and evidence |
| Docs/memory work | T1-T3 | Mason or current chat, then Archivist when consistency matters | docs/memory consistency check |
| Release work | T4B when production-impacting | Release only after approval, Scout evidence, Scribe closeout | release approval and rollback notes |

The table lists available moves, not a fixed order that must run every time.

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

Possible moves: Maestro handles it inline, or calls Mason when the edit benefits
from a separate implementation context. Scribe is optional when a durable
closeout is useful.

Scout is optional when checks are simple enough for Mason. Lens is optional when
independent review would not materially reduce risk.

## Staged Task

Use when the task needs explicit stages, verification, review, or portable
handoff evidence.

Possible moves: Mason implements, Scout verifies when evidence is material,
Lens reviews when independent review reduces risk, and Scribe records closeout
when the work is persisted.

Charlie may run before Mason when the code path is unclear.

## UI Task

Use for visible frontend changes, Storybook work, interaction states, or browser
verification.

Possible moves: Charlie researches only when the UI path is unclear, Mason uses
the UI skill when design decisions matter, Scout performs browser or visual
review, Lens reviews only when risk remains, and Scribe records closeout when
useful.

Required evidence:

- route checked;
- viewport checked;
- relevant states checked;
- screenshot or visual notes;
- visual issues found and fixed, or remaining visual risks recorded.

## Feature Work

Use when one owner goal needs decomposition into feature slices or coordinated
tasks.

Possible moves: Charlie resolves unknowns, Maestro keeps decomposition in
`brief.md` or `plan.md`, Grant audits only when plan risk is material, Mason
works per slice, Scout/Lens/Scribe/Archivist are called only when their evidence
or audit value is needed.

Owner approval is required when the plan freezes scope, affects high-risk
surfaces, or introduces meaningful dependency ordering.

## Module-Sized Work

Use when the request is large enough to need an owner-approved brief before
execution.

Possible moves: Charlie researches, Maestro writes the brief, Grant audits,
owner approval gates execution, then Maestro runs adaptive slices until
closeout. Scribe and Archivist are used only when closeout or memory value is
material.

No implementation stage starts until the brief gate is satisfied.

## High-Risk Work

Use for auth, tenancy, permissions, migrations, secrets, production deployment,
release, or other irreversible work.

Possible moves: Charlie researches risk, Grant audits the plan, owner/security
approval gates implementation, Mason works inside approved scope, Scout and Lens
verify and review, Release runs only after release approval, and Scribe or
Archivist preserve durable closeout or memory value.

High-risk work must not run as T0 or T1. It must record approval, evidence,
residual risk, and rollback/recovery notes when release is in scope.
