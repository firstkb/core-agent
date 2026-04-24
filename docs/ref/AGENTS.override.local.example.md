# Local Codex override for this repository

This file is local-only and must not be committed.

## What this override does

Use the local AI overlay for agent work in this repository.

Read in this order:

1. `AGENTS.override.md`
2. `.codex/contracts/atlas/memory-contract.md`
3. `.codex/contracts/atlas/routing-contract.md`
4. `.agents/skills/ramp-conductor/SKILL.md`
5. `ai-local/memory/index/memory-index.yaml`
6. `ai-local/memory/durable/current-state.md`
7. the relevant module entrypoint under `ai-local/memory/modules/**/README.md`
8. only then the exact frontend/backend docs needed by the task

## Rules

- Push only code to the remote repository.
- Treat `.codex/`, `.agents/`, and `ai-local/` as local-only surfaces.
- Never treat `ai-local/memory/runs/**` as canonical truth.
- When a task lands durable truth, update the correct owner surface in `ai-local/memory/**`.
- Keep hot retrieval small.
- Prefer module entrypoints and memory indexes before deep document reads.
- After an active implementation phase, compact docs into:
  - `README.md`
  - `contract.md`
  - `state.md`
  - `lessons.md`
  and archive everything else.
