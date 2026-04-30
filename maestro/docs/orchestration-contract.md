---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: orchestration_contract
lang: en
---

# Maestro vNext Orchestration Contract

## Purpose

Maestro vNext is the universal owner-facing orchestration entrypoint.

The owner sends work to Maestro, not directly to individual specialist agents.
Maestro classifies the request, selects the lightest sufficient execution path,
opens a durable record only when it is useful, assigns specialist agents when
separate context is valuable, reconciles outputs, and owns closeout.

Maestro operates through the adaptive loop defined in
`adaptive-loop-contract.md`. The canonical posture is to decide the next useful
move, not to prebuild a fixed agent chain.

Arrow diagrams in this document are shorthand for possible adaptive moves. They
are not automatic chains that must run end to end.

## Hard Boundaries

- Retired runtime provenance is owner-managed outside the active repository and
  is outside the active Maestro chain.
- Maestro owns orchestration decisions, not product implementation by default.
- Maestro must understand whether the owner is discussing, planning, executing,
  or requesting gated execution before changing files.
- Tiny direct work must not be forced into work-brief ceremony.
- High-risk work must not proceed without explicit approval gates.
- Agents do not silently advance lifecycle state.
- Lifecycle transitions must be explicit in Maestro's conversation, artifacts,
  or closeout records.
- Attempts are append-only.
- Evidence belongs to attempts and gates, not to loose chat summaries.

## Routing Tiers

Detailed routing rules live in `routing-tier-contract.md`.

### Tier 0: Direct Inline

Use for tiny low-risk changes.

Examples:

- change a button color;
- adjust one copy string;
- fix one obvious CSS bug;
- update one small docs typo.

Typical adaptive moves:

```text
Maestro
  -> direct execution or Mason-lite
  -> focused check
  -> closeout
```

State:

- no work brief;
- no persisted run unless the owner requests it;
- concise evidence in final response.
- artifact shape: none by default, or lightweight `intent.md + closeout.md`
  when the owner wants a durable record.

### Tier 1: Lightweight Task

Use for bounded implementation with useful status, evidence, or review.

Typical adaptive moves:

```text
Maestro
  -> task packet
  -> Mason
  -> Scout when checks need separate handling
  -> Lens when review is material
  -> Scribe when closeout artifact is useful
```

State:

- task is first-class;
- stages are optional but recommended when the task needs verification or review.
- artifact shape: `intent.md + task.md + closeout.md` for simple tasks,
  expanded with `packet.md`, `handoff-<stage>-<role>-NNN.json`, and `evidence.md` only
  when handoff, verification, or review needs it.

### Tier 2: Staged Task

Use for one task that needs explicit stages, meaningful verification, browser
evidence, review, or handoff.

Typical adaptive moves:

```text
Maestro
  -> Charlie when research is useful
  -> task packet
  -> Mason
  -> Scout
  -> Lens
  -> Scribe
  -> Archivist when durable memory/docs are impacted
```

State:

- task and stages are first-class;
- stage attempts and evidence are recorded when they improve the handoff.
- artifact shape: flat staged task under
  `maestro/artifact/active/<work-slug>/`.

### Tier 3: Multi-Step Work

Use for one owner goal that needs several coordinated linear steps, slices, or
dependencies.

Typical adaptive moves:

```text
Maestro
  -> Charlie
  -> linear work plan
  -> Grant when plan audit is useful
  -> owner approval when scope/risk requires it
  -> staged execution
```

State:

- work stays inside one linear Maestro artifact folder;
- decomposition stays in `plan.md` unless the owner asks for a larger product
  structure;
- execution begins only after required approvals are satisfied;
- artifact shape: `multi_step`, expanded only when needed.

### Tier 4: Gated Work

Use for work that must stop at an explicit approval gate: high-risk surfaces,
release/deploy, destructive operations, memory migration, runtime restore, or an
owner-approved large work boundary.

Typical adaptive moves:

```text
Maestro
  -> plan or brief
  -> Charlie
  -> linear work plan
  -> Grant
  -> owner approval
  -> staged execution
```

State:

- work brief is required only when it improves the approval decision;
- dependencies are explicit in `plan.md`;
- gated execution does not begin without owner approval;
- artifact shape: `full`.

Required gates:

- explicit approval before implementation when risk is high;
- explicit approval before release or production-impacting action;
- verification evidence before closeout.
- artifact shape: full shape when approvals, release, snapshots, or audit trail
  are needed.

## Default Stage Chain

Detailed stage rules live in `stage-contract.md`.

The available full stage set is:

```text
intake
planning
research
audit
implementation
verification
review
release
closeout
memory
```

Not every task uses every stage. Maestro selects the minimum sufficient chain.

## Chain Selection Rules

Use `research` when:

- the real code path is unclear;
- multiple product surfaces may be involved;
- dependencies or risks are unknown;
- prior artifacts are stale.

Use `audit` when:

- a work brief or high-risk plan needs technical challenge before approval;
- decomposition, dependencies, or acceptance are weak.

Use `implementation` when product code, docs, tests, or artifacts must change.

Use `verification` when correctness must be demonstrated by commands, browser
state, Storybook, CI, visual evidence, migration checks, or security checks.

Use `review` when the diff or evidence needs an independent read-only review.

Use `release` only when deployment, production promotion, workflow dispatch, or
release notes are in scope.

Use `closeout` when evidence and decisions should be captured as a portable run
record.

Use `memory` when durable docs or memory may need updates.

## Owner-Facing Output

At intake Maestro should report:

- route tier;
- durable record required or not;
- selected stages;
- selected agents;
- approvals required;
- artifact targets;
- next allowed action.

At closeout Maestro should report:

- completed stages;
- evidence summary;
- approval summary;
- unresolved risks;
- memory/docs impact;
- next exact action or completion status.
