---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: product_root
lang: en
---

# Maestro

Maestro is the native-first orchestration layer for owner-led AI engineering
work. It is an improved Atlas-style operating partner, not a Cockpit, backend,
dashboard, queue, or workflow engine.

The owner talks to Maestro in natural task terms. Maestro understands the
intent, chooses the smallest useful route, decides whether to work inline or
delegate, inspects evidence, and returns to the owner only at real decision
points.

```text
Owner <-> Maestro
  -> understand intent
  -> choose next useful action
  -> act inline or delegate
  -> inspect handoff/evidence
  -> ask owner, continue, revise, or close
```

## Runtime Status

This directory is now the Maestro vNext contract and artifact surface for new
Maestro-routed work.

The old `module_orchestrator` runtime is retained for legacy continuation and
provenance. Do not delete or reinterpret old `artifacts/<module>/...` runs just
because vNext exists.

## Directory Layout

```text
maestro/
  AGENTS.md
  README.md
  docs/
    runtime-contract.md
    acceptance-suite.md
    operating-charter.md
    maestro-character.md
    native-first-maestro.md
    adaptive-loop-contract.md
    orchestration-contract.md
    routing-tier-contract.md
    agent-roles.md
    agent-contracts.md
    agent-sequences.md
    security-permissions-contract.md
    artifact-model.md
    artifact-file-contract.md
    stage-contract.md
    atlas-memory-transition.md
  contracts/
    orchestration-plan.schema.json
    task-packet.schema.json
    stage-handoff.schema.json
    evidence.schema.json
    approval.schema.json
    closeout.schema.json
  templates/
    intent.md.tmpl
    plan.md.tmpl
    task.md.tmpl
    packet.md.tmpl
    approval.md.tmpl
    evidence.md.tmpl
    review.md.tmpl
    release.md.tmpl
    closeout.md.tmpl
  examples/
  artifact/
    active/
    archive/
  archive/
    current-maestro/
    current-scribe/
```

## Source Of Truth Boundary

For Maestro vNext, treat these as authoritative:

1. repository root `AGENTS.md`;
2. `.agents/skills/maestro/SKILL.md`;
3. `maestro/docs/runtime-contract.md`;
4. `maestro/contracts/*.json`;
5. `maestro/templates/*.tmpl`;
6. `.codex/config.toml` and `.codex/agents/*` for available system agents.

Supporting docs under `maestro/docs/` explain the model, but
`runtime-contract.md` is the shortest normative contract.

## Roles

Maestro may use these specialists adaptively:

- Charlie: read-only research;
- Grant: plan/brief/risk/acceptance audit;
- Mason: scoped implementation;
- Scout: verification and evidence;
- Lens: read-only review;
- Release: release/deploy after explicit approval;
- Scribe: closeout and evidence summary;
- Archivist: docs and durable memory audit;
- Atlas: transitional independent helper, not part of the formal chain.

## Artifact Roots

Active work:

```text
maestro/artifact/active/YYYY-MM-DD-<work-slug>/
```

Archived work:

```text
maestro/artifact/archive/YYYY-MM-DD-<work-slug>/
```

Use the smallest useful artifact shape. Tiny direct work may leave no file.
High-risk, multi-stage, release, or portable work must leave approvals,
packets, handoffs, evidence, and closeout.

## Transition Rules

- Do not migrate `maestro/memory/` to `maestro/memory/` without explicit owner approval.
- Do not archive Atlas without explicit owner approval.
- Do not remove old `module_orchestrator` contracts until no active legacy run depends on them.
- Do not rebuild a Cockpit unless repeated native-loop pain proves a UI/service is needed.
