# Maestro Directory Guidance

## Status

This directory is a proposal and foundation surface for Maestro vNext. It does
not override the active repository runtime until the owner explicitly promotes
it.

The removed management prototype is no longer part of this tree. Treat the
remaining files as native Maestro contracts, role definitions, artifact
guidance, and templates.

## Read Order

Before changing this directory, read:

1. repository root `AGENTS.md`
2. `maestro/README.md`
3. `maestro/docs/README.md`
4. `maestro/docs/adaptive-loop-contract.md` for routing or execution behavior
5. the specific contract files relevant to the change

## Boundaries

- Do not treat `maestro/archive/` as active runtime instruction.
- Do not recreate backend, frontend, local env, or CLI driver surfaces unless
  the owner explicitly starts that work again.
- Use `maestro/artifact/active/` and `maestro/artifact/archive/` only for the
  compact native work-record model.
- Keep persisted Maestro proposal documents and templates in English.
- Keep contracts compact. Maestro should stay a useful jet, not a process-heavy
  aircraft.

## Source Of Truth

Target boundary:

- Native Maestro conversation and tracked artifacts define the work loop.
- `maestro/artifact/active/` stores active work records and may contain multiple
  concurrent work folders.
- `maestro/artifact/archive/` stores completed, cancelled, or frozen work
  records.
- `maestro/contracts/` owns portable packet, handoff, and evidence shapes.
- `maestro/templates/` owns reusable Markdown scaffolds.
- `ai-memory/` is durable compressed memory until the accepted migration moves
  it under `maestro/memory/`.
- `.codex/`, `.agents/`, and `.agent-cli/` remain the active runtime surfaces
  until Maestro vNext is promoted.

## Authoring Rules

- Use the canonical routing tiers from `maestro/docs/routing-tier-contract.md`:
  T0 Direct Inline, T1 Lightweight Task, T2 Staged Task, T3 Feature Work, T4A
  Module-Sized Work, and T4B High Risk.
- Use the smallest sufficient artifact shape.
- JSON contracts must remain valid JSON Schema files.
- Archive copies are provenance only; do not update them to match new proposal
  contracts.
