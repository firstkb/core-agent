---
doc_status: active_pilot
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

## Sequence Recipes

| Scenario | Route Tier | Useful Specialist Moves | Required Gates |
|---|---|---|---|
| Tiny direct | T0 Inline | Maestro inline | focused check |
| Lightweight task | T1 Task | Mason only when inline work is not enough; Scribe optional | closeout when persisted |
| Staged task | T2 Staged | Mason, then Scout or Lens only when evidence/review matters; Scribe when persisted | evidence before closeout |
| UI task | T2 or T3 | Maestro uses Browser Use personally; Charlie/Mason/Scout/Lens only when useful | route, viewport, states, visual notes |
| Multi-step work | T3 Multi-Step | Charlie for unknowns, Grant for plan risk, Mason per slice, Scout/Lens/Scribe as needed | approval only when scope/risk requires it |
| Gated work | T4 Gated | Charlie, Grant, owner/security/release approval, Mason, Scout, Lens, Release only if approved | required approvals and evidence |
| Docs/memory work | T1-T3 | Mason or current chat, then Archivist when consistency matters | docs/memory consistency check |
| Release work | T4 when production-impacting | Release only after approval, Scout evidence, Scribe closeout | release approval and rollback notes |

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

Use when one bounded change benefits from a scoped assignment or closeout but does not
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
the UI skill or available web-app/frontend plugin capabilities when design or
React implementation decisions matter, Scout can supplement browser or visual
review, Lens reviews only when risk remains, and Scribe records closeout when
useful.

Plugins can help scaffold, edit, inspect, or review UI, but Maestro still routes
by capability and repository context. Do not treat plugin output as accepted
until the actual route, viewport, and states are checked.

UI-visible work requires Maestro to personally use Browser Use when available.
If Browser Use is unavailable or cannot reach the target, Maestro must record
the reason and the fallback evidence used before closeout. Scout can add
independent verification, but it does not replace Maestro's owner-facing UI
quality responsibility.

Required evidence:

- Browser Use used by Maestro, or explicit reason it was skipped;
- route checked;
- viewport checked;
- relevant states checked;
- screenshot or visual notes;
- visual issues found and fixed, or remaining visual risks recorded.

## Multi-Step Work

Use when one owner goal needs several coordinated linear steps, slices, or
dependencies.

Possible moves: Charlie resolves unknowns, Maestro keeps decomposition in
`plan.md`, Grant audits only when plan risk is material, Mason works per slice,
and Scout/Lens/Scribe/Archivist are called only when their evidence or audit
value is needed.

Owner approval is required only when the plan freezes scope, affects high-risk
surfaces, or introduces a real execution gate.

## Gated Work

Use when execution must stop at an explicit approval gate: high-risk surfaces,
release/deploy, destructive operations, memory migration, runtime restore, or an
owner-approved large work boundary.

Possible moves: Charlie researches, Maestro writes the plan or brief, Grant
audits, owner approval gates execution, then Maestro runs adaptive slices until
closeout. Scribe and Archivist are used only when closeout or memory value is
material.

No gated implementation, release, archive, or migration stage starts until the
required approval is satisfied.

## High-Risk Work

Use for auth, tenancy, permissions, migrations, secrets, production deployment,
release, or other irreversible work.

Possible moves: Charlie researches risk, Grant audits the plan, owner/security
approval gates implementation, Mason works inside approved scope, Scout and Lens
verify and review, Release runs only after release approval, and Scribe or
Archivist preserve durable closeout or memory value.

High-risk work must run as T4_gated. It must record approval, evidence,
residual risk, and rollback/recovery notes when release is in scope.
