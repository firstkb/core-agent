---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: contracts_index
lang: en
---

# Maestro vNext Contracts

These schemas define the portable contract layer for Maestro vNext.

Contracts:

- `orchestration-plan.schema.json` - Maestro mode, route, artifact shape, stages, agents, approvals, evidence, and next action.
- `task-packet.schema.json` - bounded packet for specialist or inline staged work.
- `stage-handoff.schema.json` - machine-readable stage attempt result.
- `evidence.schema.json` - evidence attachment/index item.
- `approval.schema.json` - machine-readable approval gate record.
- `closeout.schema.json` - machine-readable closeout summary.

Use Markdown templates for owner-readable artifacts and JSON contracts for gates,
subagent boundaries, and validation.
