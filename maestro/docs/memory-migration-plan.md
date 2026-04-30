---
doc_status: historical_record
doc_scope: maestro_vnext
doc_type: memory_migration_plan
lang: en
---

# Maestro Memory Migration Plan

## Purpose

Move durable agent memory from legacy `ai-memory/` to `maestro/memory/` so Maestro can
be tested against its final native-first runtime surface.

This migration was `T4_gated`: it changed source-of-truth routing, agent read
order, CI triggers, and local checks.

## Target

Current:

```text
ai-memory/
```

Target:

```text
maestro/memory/
```

`maestro/memory/` is now the durable memory root after owner approval and final
validation.

## Migration Scope

Move or update these surfaces:

- `ai-memory/**` -> `maestro/memory/**`
- `AGENTS.md`
- `README.md`
- `AGENTS.md`
- `.agents/skills/maestro/SKILL.md`
- `.agents/skills/archivist/SKILL.md`
- `.codex/agents/maestro_vnext.toml`
- `.codex/agents/memory_archivist.toml`
- `maestro/docs/*.md`
- `maestro/templates/*.tmpl`
- `.github/workflows/docs-memory-check.yml`
- `.gitignore`

Update these scripts:

- `scripts/ai/docs_memory_check.py`
- `scripts/ai/preflight.sh`

Review these legacy surfaces but do not make them active source of truth:

- owner-managed external archive
- `**`
- legacy `artifacts/**`
- `**`

## Compatibility Policy

During migration, do not keep two active memory roots.

Allowed temporary compatibility:

- short pointer note at `ai-memory/README.md` if needed;
- explicit legacy references inside archive/provenance files;
- CI/path support for both roots during the migration PR.

Not allowed:

- independent active content in both `ai-memory/` and `maestro/memory/`;
- scripts writing new task state to the old memory root after promotion;
- Maestro or Archivist read order pointing to old memory as the active default.

## Execution Checklist

- [x] Owner approval recorded for `owner_memory_migration_approval`.
- [x] Create `maestro/artifact/active/2026-04-30-memory-migration/`.
- [x] Record `intent.md`, `plan.md`, `approval-001.json`, `evidence.md`, and `closeout.md`.
- [x] Move `ai-memory/**` to `maestro/memory/**`.
- [x] Update repository docs and read-order references.
- [x] Update Maestro and Archivist skills.
- [x] Update `.codex` role configs and contracts if paths are named there.
- [x] Update active scripts from `ai-memory` to `maestro/memory`, then remove obsolete run-scaffolding scripts from the active tree.
- [x] Update `.github/workflows/docs-memory-check.yml` path filters.
- [x] Update `.gitignore` local memory paths.
- [x] Run `python3 scripts/ai/docs_memory_check.py --check`.
- [x] Run `scripts/ai/preflight.sh`.
- [x] Run a focused `rg "ai-memory"` review and classify every remaining hit as legacy/provenance or bug.
- [x] Archivist performs final memory migration audit.
- [x] Maestro closes the migration record.

## Final Archivist Audit

Archivist must verify:

- `maestro/memory/START_HERE.md` exists and is the default memory entrypoint.
- `maestro/memory/index/read-routes.yaml` exists and is referenced by active docs.
- `maestro/memory/index/memory-index.yaml` exists or the migration explicitly removes that route.
- active skills no longer default to `ai-memory/`.
- scripts no longer write new active task state to `ai-memory/`.
- CI watches `maestro/memory/**`.
- remaining `ai-memory` references are only in archive, migration notes, or compatibility pointers.
- checks listed in the execution checklist passed or have explicit skipped reasons.

## Exit Criteria

The migration is complete only when:

- all active runtime reads point to `maestro/memory/`;
- local checks and CI checks pass;
- Archivist reports no P0/P1 memory drift;
- Maestro can run a real T1/T2 task using `maestro/memory/` as memory context.
