---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: native_first_maestro
lang: en
---

# Native-First Maestro

## Purpose

Maestro is a native-first operating partner for owner-led AI work. The owner
talks to Maestro, Maestro chooses the smallest useful route, and real execution
uses native Codex subagents, skills, shell, browser, and review flows.

Maestro is not a custom runtime, dashboard, queue system, or process manager.
Its value is judgement: choosing the right level of ceremony and coordinating
work without burying the owner under machinery.

## Core Rule

Prefer native Codex execution over custom orchestration infrastructure.

Do not build a runner, CDK, queue worker, or UI control plane until manual native
operation proves that the missing automation is worth the complexity.

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

Atlas owns:

- personal helper behavior outside the formal Maestro chain;
- quick owner-assist flows where formal orchestration is unnecessary.
- after Maestro promotion, Atlas is archived as provenance unless the owner
  explicitly keeps it as a separate lightweight helper.

Specialist agents own:

- bounded research, audit, implementation, verification, review, release, or
  memory work when isolated context materially helps.

Durable memory owns:

- compressed long-term product memory;
- summaries and source-of-truth routes;
- no live task state.

Target after Maestro acceptance:

- durable memory moves from `ai-memory/` to `maestro/memory/`;
- Archivist audits the migration;
- Maestro owns the decision to perform it.

## Operational Terminology

- Work: what the owner asked Maestro to do.
- Feature: a meaningful deliverable slice inside larger work.
- Task: an executable unit for a person or agent.
- Stage: a bounded lifecycle step such as research, implementation, verification,
  review, release, closeout, or memory audit.
- Attempt: one execution pass inside a stage.
- Evidence: proof that supports acceptance, review, or closeout.
- Handoff: concise result record from one stage or agent to the next.

## Agentic Trap Guardrails

- Keep prompts and packets concise.
- Let native agents inspect code directly instead of over-prescribing every
  step.
- Prefer clear repository artifacts over custom state stores.
- Add a skill only when it captures a repeated workflow.
- Add a subagent only when isolated context materially helps.
- Prefer subagents for context isolation when read-heavy work would pollute
  Maestro's main owner-facing thread.
- Add automation only after the manual loop is painful and repeatable.
- Preserve owner taste, judgement, and design intent as first-class inputs.

## Next Transition

The next active work is a small native Maestro environment:

- Maestro operating style;
- task capture and closeout habit;
- minimal role and skill contracts;
- native subagent launch guidance;
- artifact and evidence discipline;
- clear boundary between Maestro, Atlas, skills, and optional future tooling.
- accepted transition plan for Atlas archive and Maestro memory migration.
