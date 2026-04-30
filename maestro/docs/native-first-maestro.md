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

Maestro Cockpit is not the runtime engine. It is the operational dashboard and
ledger for work state, evidence, handoffs, approvals, and agent-run visibility.

## Core Rule

Prefer native Codex execution over a custom orchestration runtime.

Do not build a runner, CDK, queue worker, or complex lifecycle machine until
manual native operation proves that the missing automation is worth the
complexity.

## Product Boundary

Maestro owns:

- conversation with the owner;
- task capture, decomposition, and routing;
- native subagent and skill selection;
- acceptance and closeout discipline.

Maestro Cockpit owns:

- work queue;
- current status, gate, blocker, and approval visibility;
- agent-run observation;
- evidence and artifact lookup;
- handoff and closeout records.

Codex runtime owns:

- ephemeral agent execution;
- tool calls;
- browser sessions;
- shell sessions;
- native subagent work;
- local reasoning context.

The Codex runtime must not be the source of truth. If a process dies, Maestro
resumes from Cockpit DB state, artifacts, and durable memory.

## Cockpit Shape

Required Phase 1 surfaces:

- Dashboard: what needs action now.
- Work queue: every meaningful owner request, including lightweight tasks.
- Work drawer: overview, evidence, artifacts, and native-agent preparation.
- Agents & Runs: instrumentation panel, not an agent launcher platform.
- Artifacts viewer: readable JSON, Markdown, logs, packet metadata, and
  evidence attachments.
- Approvals and blockers: visible gates for owner/security decisions.

Operational terminology:

- Work is what the owner asked Maestro to do.
- Agent task is the executable slice Maestro prepares for an agent.
- Agent run is telemetry for an execution attempt.
- Events are diagnostic audit detail, not the owner's primary interface.

Optional or parked:

- Kanban.
- Cloud workers.
- Runner automation.
- multi-repository portfolio views.
- velocity analytics.

## Agentic Trap Guardrails

- Keep prompts and packets concise.
- Let native agents inspect code directly instead of over-prescribing every
  step.
- Prefer CLI affordances that agents can discover and compose.
- Add a skill only when it captures a repeated workflow.
- Add a subagent only when isolated context materially helps.
- Add automation only after the manual loop is painful and repeatable.
- Preserve owner taste, judgement, and design intent as first-class inputs.

## Next Transition

After Cockpit is refocused, the next work is not a runner. The next work is a
small native Maestro environment:

- Maestro operating style;
- task capture and closeout habit;
- minimal role/skill contracts;
- native subagent launch guidance;
- artifact/evidence discipline through `maestroctl`.
