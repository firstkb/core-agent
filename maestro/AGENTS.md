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

- Do not treat `maestro/archive/` as active runtime instruction.
- Do not recreate backend, frontend, local env, service, or dashboard surfaces.
- Use `maestro/artifact/active/` and `maestro/artifact/archive/` only for compact native work records.
- Keep persisted Maestro docs, contracts, templates, and artifacts in English.
- Keep contracts compact and enforceable. Prefer cross-field schema rules over prose-only gates.
- Preserve old module artifacts; do not silently convert `artifacts/<module>/...` into vNext folders.

## Required Invariants

- Discussion and planning modes are read-only unless the owner explicitly asks to persist a file.
- High-risk work is always `gated_execution` and requires a machine-readable approval record.
- Release/deploy work requires a separate release approval.
- Specialist packets must include allowed paths, forbidden paths, evidence expectations, stop conditions, and handoff expectations.
- Subagents recommend next action; Maestro owns lifecycle decisions.
- Scribe records closeout; Archivist audits docs/memory drift.
- Atlas is archived under `maestro/archive/final-atlas/`; do not treat it as
  active runtime instruction.
