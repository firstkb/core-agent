# Memory Update Policy For Product And Workflow Decisions

- Work ID: `2026-05-01-human-agent-symbiosis`
- Status: `promoted_in_slice_5`
- Purpose: Define which decisions should be promoted from planning artifacts into durable memory and which should stay only in the active work artifact.

## Core Principle

Durable memory should preserve accepted decisions that future agents need in
order to make better product, architecture, UX, implementation, verification,
or workflow choices.

Artifacts preserve the working conversation, alternatives, evidence, open
questions, and temporary plans. Memory preserves compact accepted direction.

A decision should move to memory when a future agent would likely waste time,
make a worse choice, or violate owner intent without it.

## Promote To `decisions-log.md`

Promote a decision to `maestro/memory/durable/decisions-log.md` when it is
accepted, durable, and affects future work.

### Strategy And Product Direction

Record decisions that change or clarify:

- product strategy;
- target users or user workflow philosophy;
- product identity, positioning, or major scope;
- active vs future/deferred product layers;
- owner-confirmed product taste that should guide future implementation.

### Standards And Operating Rules

Record decisions that establish a repeatable standard, for example:

- Definition of Done;
- evidence budget;
- UI/UX acceptance policy;
- agent/tool responsibility boundaries;
- memory maintenance policy;
- FE/BE architecture intake expectations;
- release, security, auth, tenant, or migration gates.

### Architecture, Source Of Truth, And Ownership

Record decisions that affect:

- module boundaries;
- app/package/service ownership;
- canonical docs or source-of-truth routing;
- runtime contracts;
- shared UI Kit or platform primitive boundaries;
- backend service/repository/migration ownership;
- docs/memory route maps.

### Decisions That Improve Future Development

Record decisions that will directly improve later engineering work:

- reusable implementation constraints;
- repeated failure prevention;
- durable lessons after a verified mistake;
- team/agent selection rules;
- outsourced capability policy;
- performance, maintainability, testing, or review standards;
- accepted defaults that prevent repeated owner clarification.

### High-Risk Or Policy Decisions

Always record accepted decisions involving:

- auth;
- tenant isolation;
- permissions/access;
- secrets, PII, or sensitive data;
- destructive actions;
- migrations;
- production/release;
- external service/API commitments;
- legal, billing, compliance, or privacy-sensitive product behavior.

## Keep Only In Artifact

Keep a note only in the active artifact when it is useful for the current work
but not durable enough for memory.

Examples:

- brainstorming;
- rejected options;
- unresolved questions;
- draft language before owner acceptance;
- temporary task plans;
- local implementation notes;
- one-off UI preferences that do not become standards;
- small tactical choices visible in code;
- evidence logs and command outputs;
- screenshots or QA details for a single run;
- role/tool considerations that did not become policy;
- conclusions that are easier and safer to rediscover from code.

## Write-Through Rules

`decisions-log.md` is not always the only write target.

| Decision Effect | Also Update |
|---|---|
| Changes active product/runtime state | `maestro/memory/durable/current-state.md` |
| Changes module/app/package/tool ownership | `maestro/memory/durable/module-index.md`, relevant module memory, read routes |
| Changes repository/runtime layout | `maestro/memory/durable/repo-map.md` |
| Changes frontend contract | `platform/frontend/docs/contracts/**` or relevant frontend canonical doc |
| Changes backend contract | `platform/backend/docs/contracts/**` or relevant backend canonical doc |
| Changes Maestro/agent workflow | relevant `.agents/**`, `.codex/**`, `maestro/docs/**`, and memory summary |
| Captures verified reusable lesson | relevant `lessons.md` or `maestro/memory/lessons/**` |

Do not duplicate full content across all targets. Put the complete normative
rule in the owning surface, and keep memory as a compact retrieval summary with
links.

## Promotion Test

Before promoting a decision from artifact to memory, Maestro should ask:

- Is the decision accepted by the owner or proven by implementation evidence?
- Will future agents need this before reading code or canonical docs?
- Does it change strategy, standard, architecture, ownership, risk, or workflow?
- Is it stable enough to survive beyond the current task?
- Can it be stated compactly without preserving the whole discussion?
- Is there a better canonical owner than memory?

If the answer is no, keep it in the artifact.

## Decision Entry Shape

For `decisions-log.md`, prefer a compact DEC entry:

```text
### DEC-XXX Short Decision Title

- Date: YYYY-MM-DD
- Status: active
- State: owner-confirmed | landed | planned | superseded
- Decision: <one compact durable decision>
- Rationale: <why future agents need this>
- Sources:
  - <artifact/doc/source path>
```

Use one DEC entry per coherent policy decision. Do not create a DEC for every
sub-bullet when one compact decision can cover the operating rule.

## Planning Artifact Promotion Flow

For this human-agent symbiosis work, the active artifact is the staging area.
During planning, keep decisions in artifact files. At the end of the planning
phase, Maestro should prepare a compact "memory promotion list" for owner
approval.

Likely promotion candidates from this work:

- Human-agent responsibility split and Maestro's accountability.
- Maestro-owned UI/UX judgment with owner return points for material
  product/taste/workflow decisions.
- Agent selection thresholds and no-default-subagent-chain rule.
- Definition of Done and evidence budget.
- Outsourced capability policy, especially Build Web Apps selective use and
  FE browser evidence surfaces.
- Memory update policy itself.
- Project architecture intake for Maestro/Mason if it becomes an accepted
  repeatable programming standard.

Do not promote raw discussion, doubts, or intermediate alternatives.

## Closeout Rule

Every non-trivial Maestro closeout should say one of:

- `Memory update: not needed` with a short reason;
- `Memory update: proposed` with the target files and owner approval needed;
- `Memory update: completed` with the target files changed and checks run.

This prevents philosophy and standards from disappearing while avoiding memory
as a task journal.

## Slice 5 Promotion Note

Slice 5 promoted the accepted durable parts of this policy into
`maestro/memory/durable/decisions-log.md` as `DEC-093`, and added compact
baseline wording to `maestro/memory/START_HERE.md` and
`maestro/memory/agent-workflow.md`. This artifact remains provenance and should
not be copied wholesale into memory.
