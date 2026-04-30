# Final Atlas Archive

Status: frozen archive
Date: 2026-04-30

This folder preserves the retired Atlas helper and its operational payloads.
It is not active runtime instruction and must not be loaded by default.

Archived contents:

- `skill/`: former `.agents/skills/atlas/` skill.
- `memory-atlas/`: former `maestro/memory/atlas/` prompts, templates, manifest,
  migration audits, and workflow notes.
- `memory-runs/`: former `maestro/memory/runs/` run packets and summaries.
- `memory-scripts/`: former placeholder memory scripts folder.
- `memory-working/`: former placeholder working-memory folder.
- `scripts/`: former Atlas scaffolding/version scripts.

Active replacement:

- Maestro runtime contract: `maestro/docs/runtime-contract.md`
- Maestro skill: `.agents/skills/maestro/SKILL.md`
- Maestro artifacts: `maestro/artifact/active/` and `maestro/artifact/archive/`
- Durable memory: `maestro/memory/`

Do not restore Atlas as an active skill, active memory folder, or default
platform entrypoint without explicit owner approval.
