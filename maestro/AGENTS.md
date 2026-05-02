# Maestro Directory Guidance

## Status

This directory is the active pilot surface for Maestro vNext. It defines the
native adaptive loop, artifact model, contracts, templates, examples, and role
boundaries for new Maestro-routed work.

The legacy `module_orchestrator` material is archived or retained only for old
run continuation and provenance.

## Read Order

Before changing Maestro behavior, read:

1. repository root `AGENTS.md`;
2. `maestro/README.md`;
3. `maestro/docs/runtime-contract.md`;
4. relevant schemas under `maestro/contracts/`;
5. relevant templates under `maestro/templates/`;
6. the exact `.agents/skills/<role>/SKILL.md` or `.codex/agents/<agent>.toml` being changed.

Use the longer docs in `maestro/docs/` for rationale and edge cases.

## Boundaries

- Retired role/skill provenance is owner-managed outside the active repository.
  Do not recreate a local `maestro/archive/` instruction surface.
- Do not recreate backend, frontend, local env, service, or dashboard surfaces.
- Use `maestro/artifact/active/` and `maestro/artifact/archive/` only for compact native work records.
- Keep persisted Maestro docs, contracts, templates, and artifacts in English.
- Keep contracts compact and enforceable. Prefer cross-field schema rules over prose-only gates.
- Preserve old module artifacts; do not silently convert `artifacts/<module>/...` into vNext folders.

## Required Local Invariants

- Discussion mode is read-only unless the owner explicitly asks to persist a
  file.
- Planning mode allows lean Maestro artifact updates once T1+ work is
  understood; it does not allow product-code edits or high-risk execution.
- Canonical mode, approval, artifact, delegation, and closeout behavior lives in
  `maestro/docs/runtime-contract.md`.
- Keep local reminders here only when they do not conflict with the runtime
  contract.
