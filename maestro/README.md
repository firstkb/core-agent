---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: product_root
lang: en
---

# Maestro

Maestro is the proposed native-first orchestration layer for owner-led AI work.
It is intended to become an improved Atlas-style operating partner: the owner
talks to Maestro in natural task terms, and Maestro chooses the smallest useful
route, skill set, subagent usage, artifact shape, evidence needs, and closeout
discipline.

This directory is now a contract and knowledge surface only. The previous local
management prototype was intentionally removed from this tree.

The current live repository runtime still remains under:

- `docs/maestro/module-orchestrator-v2-spec-pack/`
- `.codex/contracts/module_orchestrator/`
- `.codex/templates/module_orchestrator/`
- `.agents/skills/maestro/`

## Target Role

Maestro vNext is the owner-facing entrypoint for work ranging from tiny direct
changes to full module-sized initiatives.

Maestro decides:

- whether the request can be handled inline;
- whether a lightweight artifact record is useful;
- whether research, audit, implementation, verification, review, release, or
  memory stages are needed;
- which specialist agents should be used;
- which skills should shape the work;
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
    maestro-character.md
    native-first-maestro.md
    orchestration-contract.md
    routing-tier-contract.md
    agent-roles.md
    agent-contracts.md
    agent-sequences.md
    security-permissions-contract.md
    artifact-model.md
    artifact-file-contract.md
    stage-contract.md
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
  archive/
    README.md
    current-maestro/
    current-scribe/
```

## Source Of Truth Boundary

Target boundary:

- Maestro conversation and repository artifacts are the working source for
  native orchestration.
- `maestro/contracts/` defines portable packet, handoff, and evidence shapes.
- `maestro/templates/` provides lightweight Markdown scaffolds.
- `ai-memory/` remains durable compressed memory, not live task state.
- `.codex/`, `.agents/`, and `.agent-cli/` remain the active runtime surfaces
  until Maestro vNext is promoted.

## Removed Scope

The removed prototype scope included:

- backend service;
- frontend management UI;
- local CLI driver;
- local env files;
- dev and smoke scripts;
- local artifact output folders;
- service, database, UI, run-control, and implementation-slice documents.

Do not reintroduce those surfaces unless the native Maestro loop proves that a
separate UI or service would remove real repeated friction.
