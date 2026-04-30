---
doc_status: proposal
doc_scope: maestro_vnext
doc_type: contracts_index
lang: en
---

# Maestro vNext Contracts

These schemas define the proposed portable contract layer for Maestro vNext.

They are not active runtime schemas until the owner accepts the vNext model and
the implementation wires them into native skills, agent packets, or validation
commands.

Contracts:

- `orchestration-plan.schema.json` - Maestro intake route, stage chain, agents,
  gates, and artifact targets.
- `task-packet.schema.json` - bounded task packet for implementation and stage
  launch.
- `stage-handoff.schema.json` - machine-readable stage attempt result.
- `evidence.schema.json` - evidence attachment/index item.
