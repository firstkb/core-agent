---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: orchestration_contract
lang: en
---

# Maestro vNext Orchestration Contract

## Purpose

Maestro vNext is the universal owner-facing orchestration entrypoint.

The owner sends work to Maestro, not directly to individual specialist agents.
Maestro classifies the request, selects the lightest sufficient execution path,
opens state only when state is useful, assigns specialist agents when separate
context is valuable, reconciles outputs, and owns closeout.

## Hard Boundaries

- Atlas remains independent and outside the formal Maestro chain.
- Maestro owns orchestration decisions, not product implementation by default.
- Tiny direct work must not be forced into work-brief ceremony.
- High-risk work must not proceed without explicit approval gates.
- Agents do not silently advance lifecycle state.
- State transitions must happen through typed commands or API transitions.
- Attempts are append-only.
- Evidence belongs to attempts and gates, not to loose chat summaries.

## Routing Tiers

### Tier 0: Direct

Use for tiny low-risk changes.

Examples:

- change a button color;
- adjust one copy string;
- fix one obvious CSS bug;
- update one small docs typo.

Expected path:

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

### Tier 1: Task

Use for bounded implementation with useful status, evidence, or review.

Expected path:

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

### Tier 2: Feature

Use for product capability work with multiple stages or meaningful acceptance.

Expected path:

```text
Maestro
  -> Charlie when research is useful
  -> task/feature plan
  -> Mason
  -> Scout
  -> Lens
  -> Scribe
  -> Archivist when durable memory/docs are impacted
```

State:

- feature and tasks are first-class;
- evidence and approvals are recorded.

### Tier 3: Module-Sized Work

Use for large initiatives that require decomposition, owner approval, or a
multi-feature plan.

Expected path:

```text
Maestro
  -> brief
  -> Charlie
  -> feature/task decomposition
  -> Grant
  -> owner approval
  -> staged execution
```

State:

- work brief is required;
- feature order and dependencies are explicit;
- execution does not begin without owner approval.

### Tier 4: High Risk

Use for auth, tenancy, permissions, migrations, secrets, release, deployment, or
other irreversible or security-sensitive work.

Expected path:

```text
Maestro
  -> Charlie
  -> Grant
  -> owner approval
  -> Mason
  -> Scout with required gates
  -> Lens
  -> owner/security/release approval
  -> Release when deployment is in scope
  -> Scribe
  -> Archivist when memory/docs are impacted
```

Required gates:

- explicit approval before implementation when risk is high;
- explicit approval before release or production-impacting action;
- verification evidence before closeout.

## Default Stage Chain

The default full chain is:

```text
intake
planning
research
brief_audit
implementation
verification
review
release
closeout
memory_audit
```

Not every task uses every stage. Maestro selects the minimum sufficient chain.

## Chain Selection Rules

Use `research` when:

- the real code path is unclear;
- multiple product surfaces may be involved;
- dependencies or risks are unknown;
- prior artifacts are stale.

Use `brief_audit` when:

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

Use `memory_audit` when durable docs or `ai-memory` may need updates.

## Owner-Facing Output

At intake Maestro should report:

- route tier;
- run/state required or not;
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
