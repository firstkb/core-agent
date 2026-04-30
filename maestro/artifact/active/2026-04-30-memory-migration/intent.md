# Intent

- Work ID: `memory-migration`
- Work slug: `2026-04-30-memory-migration`
- Conversation mode: `gated_execution`
- Route tier: `T4_gated`
- Artifact shape: `full`

## Owner Request

Move durable agent memory from legacy `ai-memory/` to `maestro/memory/` before
testing Maestro, so the Maestro runtime is tested against its final memory root.

## Next Useful Action

Perform the migration, update active docs/skills/scripts/CI references, run
checks, and record migration evidence.
