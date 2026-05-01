---
doc_status: retired_reference
doc_scope: maestro_vnext
doc_type: orchestration_contract_retired
lang: en
---

# Retired Internal Coordination Contract

## Read Status

This file is retained as a compatibility pointer for older manual links. It is
not current runtime guidance.

Do not use this document to require fixed stage chains, mandatory specialist
sequences, or owner-facing reports about route tier, selected stages, selected
agents, packets, or handoffs.

## Current Replacements

- `runtime-contract.md` is the canonical Maestro runtime contract.
- `adaptive-loop-contract.md` defines the adaptive loop.
- `routing-tier-contract.md` defines route tiers.
- `stage-contract.md` defines available stage semantics.
- `agent-selection-thresholds.md` defines when to consider specialists.

## Historical Intent

The original document described internal coordination mechanics for a
native-first Maestro pilot. The useful idea remains: Maestro owns the owner
conversation, chooses the smallest sufficient execution path, uses specialists
only when they improve the outcome, reconciles evidence, and keeps internal
mechanics out of owner-facing messages unless they affect product, risk,
timing, or evidence.

That idea now lives in the current replacement docs above.
