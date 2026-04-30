# Platform Studio Docs Compaction Policy

Status: active local policy
Last compacted: 2026-04-25

This policy applies to `platform/frontend/docs/platform-studio/**` and the compact local maps under `maestro/memory/docs/frontend/platform-studio/`.

## Rules

- Keep source docs repo-relative.
- Do not treat prompt files, donor app docs, old code reference, or task prompts as active truth.
- Read compact memory first, then exact source docs.
- Verify working plans against code before treating behavior as landed.
- After a feature slice lands, compact durable facts into `maestro/memory/modules/domains/platform-studio/state.md` or `contract.md`.
- Put reusable mistakes and guardrails into `maestro/memory/modules/domains/platform-studio/lessons.md`.

## Mature Module Footprint

For a mature Platform Studio tool, aim for:

- `README.md`
- `contract.md`
- `state.md`
- `lessons.md`
- `tools/<tool>.md` when the tool belongs to the suite map

## When A Source Doc Becomes Archive Candidate

A tracked source doc becomes archive candidate when:

- it is a prompt, handoff, or one-time workstream plan,
- a newer contract supersedes it,
- its durable outcome is already captured in module memory,
- it is donor/reference material,
- it documents a closed implementation phase rather than current behavior.

## Conflict Resolution

Priority order:

1. Current code and migrations.
2. Root repo runtime docs and active AGENTS guidance.
3. `maestro/memory` compact module contracts/state.
4. Tracked active Platform Studio contracts.
5. Working plans.
6. Operational scaffolds and reference-only docs.

If a working plan contradicts a hot contract, the hot contract wins unless code proves the contract is stale.
