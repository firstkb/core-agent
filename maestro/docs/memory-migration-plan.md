---
doc_status: active_pilot
doc_scope: maestro_vnext
doc_type: memory_migration_plan
lang: en
---

# Maestro Memory Migration Plan

## Purpose

Move durable agent memory from legacy `ai-memory/` to `maestro/memory/` so Maestro can
be tested against its final native-first runtime surface.

This migration is `T4_gated`: it changes source-of-truth routing, agent read
order, CI triggers, local checks, and legacy Atlas compatibility.

## Target

Current:

```text
ai-memory/
```

Target:

```text
maestro/memory/
```

`maestro/memory/` becomes the durable memory root after owner approval and final
Archivist audit.

## Migration Scope

Move or update these surfaces:

- `ai-memory/**` -> `maestro/memory/**`
- `AGENTS.md`
- `README.md`
- `docs/codex-native-repo.md`
- `.agents/skills/maestro/SKILL.md`
- `.agents/skills/archivist/SKILL.md`
- `.agents/skills/atlas/SKILL.md`
- `.codex/agents/maestro_vnext.toml`
- `.codex/agents/memory_archivist.toml`
- `maestro/docs/*.md`
- `maestro/templates/*.tmpl`
- `.github/workflows/docs-memory-check.yml`
- `.gitignore`

Update these scripts:

- `scripts/ai/docs_memory_check.py`
- `scripts/ai/automation_versions.py`
- `scripts/ai/new-run.py`
- `scripts/ai/new-run.sh`
- `scripts/ai/preflight.sh`

Review these legacy surfaces but do not make them active source of truth:

- `maestro/archive/**`
- `docs/archive/**`
- legacy `artifacts/**`
- `.agent-cli/**`

## Compatibility Policy

During migration, do not keep two active memory roots.

Allowed temporary compatibility:

- short pointer note at `ai-memory/README.md` if needed;
- explicit legacy references inside archive/provenance files;
- CI/path support for both roots during the migration PR.

Not allowed:

- independent active content in both `ai-memory/` and `maestro/memory/`;
- scripts writing new run state to the old memory root after promotion;
- Maestro or Archivist read order pointing to old memory as the active default.

## Execution Checklist

- [ ] Owner approval recorded for `owner_memory_migration_approval`.
- [ ] Create `maestro/artifact/active/YYYY-MM-DD-memory-migration/`.
- [ ] Record `intent.md`, `plan.md`, `approval-001.json`, `evidence.md`, and `closeout.md`.
- [ ] Move `ai-memory/**` to `maestro/memory/**`.
- [ ] Update repository docs and read-order references.
- [ ] Update Maestro, Archivist, and Atlas skills.
- [ ] Update `.codex` role configs and contracts if paths are named there.
- [ ] Update scripts listed above from `ai-memory` to `maestro/memory`.
- [ ] Update `.github/workflows/docs-memory-check.yml` path filters.
- [ ] Update `.gitignore` local memory paths.
- [ ] Run `python3 scripts/ai/docs_memory_check.py --check`.
- [ ] Run `python3 scripts/ai/automation_versions.py --check`.
- [ ] Run `scripts/ai/preflight.sh`.
- [ ] Run a focused `rg "ai-memory"` review and classify every remaining hit as legacy/provenance or bug.
- [ ] Archivist performs final memory migration audit.
- [ ] Maestro closes the migration and archives the active artifact folder.

## Final Archivist Audit

Archivist must verify:

- `maestro/memory/START_HERE.md` exists and is the default memory entrypoint.
- `maestro/memory/index/read-routes.yaml` exists and is referenced by active docs.
- `maestro/memory/index/memory-index.yaml` exists or the migration explicitly removes that route.
- active skills no longer default to `ai-memory/`.
- scripts no longer write new active runs to `ai-memory/`.
- CI watches `maestro/memory/**`.
- remaining `ai-memory` references are only in archive, migration notes, or compatibility pointers.
- checks listed in the execution checklist passed or have explicit skipped reasons.

## Exit Criteria

The migration is complete only when:

- all active runtime reads point to `maestro/memory/`;
- local checks and CI checks pass;
- Archivist reports no P0/P1 memory drift;
- Maestro can run a real T1/T2 task using `maestro/memory/` as memory context.
