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

Use Markdown templates for owner-readable artifacts and compact normal work.
Use JSON contracts when gates, machine-readable subagent boundaries, resume,
auditability, release evidence, or validation require them.

Approval requirement names in plans/packets map to approval records as follows:

| Requirement | Approval record `approval_type` |
|---|---|
| `owner_plan_approval` | `plan` |
| `owner_execution_approval` | `execution` |
| `owner_high_risk_approval` | `high_risk_implementation` |
| `owner_release_approval` | `release` |
| `owner_memory_migration_approval` | `memory_migration` |
| `owner_archive_approval` | `archive` |
