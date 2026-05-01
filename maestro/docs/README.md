---
doc_status: active
doc_scope: maestro_vnext
doc_type: docs_index
lang: en
---

# Maestro vNext Docs

This directory documents native-first Maestro: a human-led, agent-accelerated
solution architect and engineering partner.

Read order for normative behavior:

1. `../AGENTS.md`
2. `runtime-contract.md`
3. `../contracts/README.md`
4. `../templates/`
5. role-specific skills under `.agents/skills/`
6. role-specific Codex configs under `.codex/agents/`

## Doc Classes

### Canonical Runtime Contract

- `runtime-contract.md` - compact canonical Maestro behavior. When another
  Maestro doc conflicts with this file, update the other doc or treat it as
  historical.

### Active Supporting Docs

Use these when the topic is directly relevant. They are not mandatory hot-path
reads for every Maestro entry.

- `operating-charter.md`
- `maestro-character.md`
- `adaptive-loop-contract.md`
- `routing-tier-contract.md` (internal mechanics; not owner-facing UX)
- `agent-selection-thresholds.md`
- `agent-roles.md`
- `agent-contracts.md`
- `security-permissions-contract.md`
- `artifact-model.md`
- `artifact-file-contract.md`
- `stage-contract.md`

### Validation And Promotion Docs

- `acceptance-suite.md`

### Reference And Historical Docs

Read these only when their history or rationale is needed.

- `native-first-maestro.md` - native-first rationale and guardrails. Runtime
  behavior remains in `runtime-contract.md`.
- `memory-migration-plan.md` - completed memory migration record. Archivist may
  read it when migration provenance is in scope; it is not normal hot-path
  guidance.

### Retired Compatibility Pointers

These remain only to avoid stale manual links and to document what replaced
older wording. Do not use them as current runtime guidance.

- `orchestration-contract.md` - replaced by `runtime-contract.md`,
  `adaptive-loop-contract.md`, `routing-tier-contract.md`, and
  `stage-contract.md`.
- `agent-sequences.md` - replaced by `agent-selection-thresholds.md`.

`runtime-contract.md` is the compact canonical contract. The other documents
explain rationale and edge cases and should not contradict it.
