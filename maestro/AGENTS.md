# Maestro Directory Guidance

## Status

This directory is a proposal and foundation surface for Maestro vNext. It does
not override the active repository runtime until the owner explicitly promotes
it.

## Read Order

Before changing this directory, read:

1. repository root `AGENTS.md`
2. `maestro/README.md`
3. `maestro/docs/README.md`
4. the specific contract files relevant to the change

## Boundaries

- Do not treat `maestro/archive/` as active runtime instruction.
- Do not create `maestro/backend/`, `maestro/frontend/`, or
  `maestro/artifacts/` until the owner accepts an implementation slice.
- Keep persisted Maestro proposal documents and templates in English.
- Keep contracts compact. Maestro should stay a useful jet, not a process-heavy
  aircraft.

## Source Of Truth

Target boundary:

- Maestro API/DB owns live operational state.
- `maestro/artifacts/` stores portable evidence, handoffs, exports, and
  append-only run records.
- `maestroctl` is the local typed driver for agents and humans.
- `ai-memory/` is durable compressed memory, not live operational state.

## Authoring Rules

- Use the canonical routing tiers from `maestro/docs/routing-tier-contract.md`:
  T0 Direct Inline, T1 Lightweight Task, T2 Staged Task, T3 Feature Work, T4A
  Module-Sized Work, and T4B High Risk.
- Use the smallest sufficient artifact shape.
- JSON contracts must remain valid JSON Schema files.
- Archive copies are provenance only; do not update them to match new proposal
  contracts.
