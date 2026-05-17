# Maestro Local Workspace

This directory holds local operator-facing helpers for Maestro workflows.

Tracked:

- `prompts/` contains reusable prompts for local Codex automations and owner
  handoff chats.

Ignored:

- `briefs/` contains generated morning brief caches such as
  `YYYY-MM-DD-morning-focus.md`.

Generated briefs are not durable product memory, not runtime source of truth,
and not Maestro work artifacts. When a brief reveals a real issue that needs
execution, create or resume a normal work artifact under `maestro/artifact/`.
