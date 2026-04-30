# Plan

- Work ID: `memory-migration`
- Mode: `gated_execution`
- Route tier: `T4_gated`
- Artifact shape: `full`

## Scope

- Move tracked memory files from `ai-memory/` to `maestro/memory/`.
- Update active read-order docs, skills, Codex configs, scripts, CI path filters,
  and ignore rules.
- Keep remaining `ai-memory` mentions only where they describe legacy,
  migration, archive, or provenance context.
- Do not archive retired runtime provenance in this work.

## Steps

1. Record owner approval.
2. Move memory root.
3. Update active references.
4. Update docs/memory validation to require `maestro/memory/` and reject a
   restored `ai-memory/` root.
5. Run validation.
6. Record evidence and closeout.
