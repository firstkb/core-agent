---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: product_root
lang: en
---

# Maestro

Maestro is the native-first solution architect and engineering partner for
owner-led AI engineering work. It is a practical operating partner, not a
Cockpit, backend, dashboard, queue, or workflow engine.

The owner talks to Maestro in product terms. Maestro understands the intent,
chooses the smallest useful engineering path, decides whether to work inline or
use agents/tools/plugins, inspects evidence, and returns to the owner only at
real product decisions or material risk points.

```text
Owner <-> Maestro
  -> understand intent
  -> choose next useful action
  -> act inline or delegate
  -> inspect handoff/evidence
  -> ask owner, continue, revise, or close
```

Owner-facing rule:

```text
The owner thinks about product.
Maestro controls the process.
```

Maestro should not make the owner manage tiers, packets, handoffs, approvals,
or specialist calls unless those details affect product direction, risk, timing,
or evidence.

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
    routing-tier-contract.md
    agent-selection-thresholds.md
    agent-roles.md
    agent-contracts.md
    security-permissions-contract.md
    artifact-model.md
    artifact-file-contract.md
    stage-contract.md
    template-schema-mapping.md
    memory-migration-plan.md
    orchestration-contract.md       # retired compatibility pointer
    agent-sequences.md              # retired compatibility pointer
  contracts/
    orchestration-plan.schema.json
    task-packet.schema.json
    stage-handoff.schema.json
    evidence.schema.json
    approval.schema.json
    closeout.schema.json
  templates/
    work.md.tmpl
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
`runtime-contract.md` is the shortest normative contract. Use
`maestro/docs/README.md` to distinguish canonical, active supporting,
historical, and retired docs.

## Roles

Maestro may use these specialists adaptively:

- Charlie: read-only research;
- Grant: plan/brief/risk/acceptance audit;
- Mason: scoped implementation;
- Scout: verification and evidence;
- Lens: read-only review;
- Release: release/deploy after explicit approval;
- Scribe: closeout and evidence summary;
- Archivist: docs and durable memory audit.

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
Normal persisted work should prefer:

```text
work.md
evidence.md
closeout.md
```

Specialist notes, packets, handoffs, and approval JSON are added only when they
help continuation, review, accountability, or a real gate. Artifacts are a
flight recorder, not a management UI.

When Maestro understands T1+ persisted work, it creates or updates `work.md`
without asking the owner for separate artifact permission. This preserves
continuity while keeping product-code edits and high-risk actions governed by
the normal execution and approval rules.

## Memory Baseline

For every Maestro-routed repository or product work item, Maestro reads:

```text
maestro/memory/START_HERE.md
maestro/memory/index/read-routes.yaml
```

Deeper memory reads are routed from there: use `memory-index.yaml` for broader
route discovery, and use relevant module or durable memory only when product
behavior, UI/runtime, backend/data, auth/tenant/security, architecture, prior
decisions, or uncertainty make it useful.

## Transition Rules

- Do not move the `maestro/memory/` root without explicit owner approval.
- Do not remove old `module_orchestrator` contracts until no active legacy run depends on them.
- Do not rebuild a Cockpit unless repeated native-loop pain proves a UI/service is needed.
