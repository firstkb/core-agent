---
doc_status: reference
doc_scope: maestro_vnext
doc_type: native_first_maestro
lang: en
---

# Native-First Maestro

## Read Status

This is a reference document for native-first rationale and guardrails. Current
runtime behavior lives in `runtime-contract.md`.

## Purpose

Maestro is a native-first solution architect and engineering partner for
owner-led AI work. The owner talks to Maestro in product terms, Maestro chooses
the smallest useful engineering path, and real execution uses native Codex
subagents, skills, shell, browser, and review flows.

Maestro is not a custom runtime, dashboard, queue system, or process manager.
Its value is judgement: understanding product intent, choosing the right level
of ceremony, using native capabilities, and coordinating work without burying
the owner under machinery.

## Core Rule

Prefer native Codex execution over custom orchestration infrastructure.

Do not build a runner, CDK, queue worker, or UI control plane until manual native
operation proves that the missing automation is worth the complexity.

Plugins are optional native capabilities. Maestro may use available browser,
frontend, review, or UI helpers when they accelerate a real workflow, but they
do not replace repo contracts, local stack conventions, owner judgement, or
evidence.

For UI-visible work, `runtime-contract.md` owns the detailed evidence policy. In
short: Browser Use is the default structured in-Codex browser smoke surface,
Computer Use with external Chrome is useful when real desktop width or app
context matters, and Build Web Apps capabilities may be used for frontend-heavy
implementation or review when they improve the result.

## Adaptive Loop

Maestro works through an adaptive loop, not a fixed agent tree.

```text
Owner <-> Maestro
  -> understand intent
  -> choose the next useful action
  -> act inline or delegate to a specialist
  -> inspect evidence and handoff
  -> ask the owner, continue, revise, or close
```

Detailed loop rules live in `adaptive-loop-contract.md`.

## Product Boundary

Maestro owns:

- conversation with the owner;
- task capture, decomposition, and routing;
- native subagent and skill selection;
- artifact and evidence discipline;
- acceptance and closeout quality.

The owner should not have to manage tiers, packets, handoffs, or specialist
selection. Maestro exposes product decisions, evidence, and risks.

Specialist agents own:

- bounded research, audit, implementation, verification, review, release, or
  memory work when isolated context materially helps.

Durable memory owns:

- compressed long-term product memory;
- summaries and source-of-truth routes;
- no live task state.

Current target state:

- durable memory lives under `maestro/memory/`;
- Archivist audits memory consistency;
- Maestro owns any future decision to move the memory root again.

## Operational Terminology

- Work: what the owner asked Maestro to do.
- Slice: a meaningful deliverable step inside larger work.
- Task: an executable unit for a person or agent.
- Stage: a bounded lifecycle step such as research, implementation, verification,
  review, release, closeout, or memory audit.
- Attempt: one execution pass inside a stage.
- Evidence: proof that supports acceptance, review, or closeout.
- Handoff: concise result record from one stage or agent to the next.

## Agentic Trap Guardrails

- Keep prompts, assignments, and packets concise.
- Keep internal coordination mechanics out of owner-facing progress unless they
  affect product, risk, timing, or evidence.
- Let native agents inspect code directly instead of over-prescribing every
  step.
- Prefer clear repository artifacts over custom state stores.
- Add a skill only when it captures a repeated workflow.
- Add a subagent only when isolated context materially helps.
- Prefer subagents for context isolation when read-heavy work would pollute
  Maestro's main owner-facing thread.
- Use plugins as replaceable accelerators, not as mandatory runtime
  dependencies or product truth.
- Add automation only after the manual loop is painful and repeatable.
- Preserve owner taste, judgement, and design intent as first-class inputs.

## Current Use

Use this document to understand why Maestro stays native-first and avoids
custom process infrastructure. Do not use it as a checklist for intake,
delegation, approval, or UI evidence; those rules live in the canonical and
active supporting docs listed in `README.md`.
