---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: product_root
lang: en
---

# Maestro

Maestro is the proposed orchestration product surface for the next generation
control plane.

This directory is a foundation surface, not a replacement for the current live
runtime yet. The current live Maestro contract remains under:

- `docs/maestro/module-orchestrator-v2-spec-pack/`
- `.codex/contracts/module_orchestrator/`
- `.codex/templates/module_orchestrator/`
- `.agents/skills/maestro/`

## Target Role

Maestro vNext is the owner-facing entrypoint for work ranging from tiny direct
changes to full module-sized initiatives.

The owner should be able to ask Maestro for work in natural task terms. Maestro
then decides:

- whether formal state is required;
- whether a run artifact tree is required;
- which stage chain is needed;
- which specialist agents should be used;
- which approval gates must be satisfied;
- which evidence is required before closeout.

Atlas remains an independent personal helper and does not become part of the
formal Maestro chain.

## Directory Layout

```text
maestro/
  AGENTS.md
  README.md
  docs/
    README.md
    operating-charter.md
    orchestration-contract.md
    routing-tier-contract.md
    agent-contracts.md
    agent-sequences.md
    security-permissions-contract.md
    artifact-model.md
    artifact-file-contract.md
    stage-contract.md
    ui-cockpit-contract.md
    run-control-contract.md
    agent-roles.md
    state-model.md
    db-model.md
    api-contract.md
    maestroctl-contract.md
  contracts/
    README.md
    orchestration-plan.schema.json
    task-packet.schema.json
    stage-handoff.schema.json
    evidence.schema.json
  templates/
    task.md.tmpl
    stage-attempt.md.tmpl
    closeout.md.tmpl
```

Future implementation directories should be added only after the foundation
contracts are accepted:

```text
maestro/backend/
maestro/frontend/
maestro/artifacts/
```

## Source Of Truth Boundary

Target boundary:

- Maestro API/DB is the live operational state owner.
- `maestro/artifacts/` stores portable snapshots, evidence, handoffs, and
  append-only run records.
- `.agent-cli` remains a local compatibility, validation, import, and export
  bridge while the current artifact model is migrated.
- `ai-memory/` remains durable compressed memory, not live task state.
