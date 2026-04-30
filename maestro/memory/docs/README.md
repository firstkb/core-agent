# Documentation Memory

Status: local planning and compaction layer
Last compacted: 2026-04-25

This folder contains compact maps and future rewrite plans for tracked product docs.
It does not move or replace tracked docs by itself.

## Read This When

- planning a physical rewrite of `platform/frontend/docs`
- planning a physical rewrite of `platform/backend/docs`
- deciding whether a tracked doc is active, supporting, proposed, or historical
- preventing agents from reading large or stale docs by default

## Local Docs

- `maestro/memory/START_HERE.md`
- `maestro/memory/docs/target-docs-structure.md`
- `maestro/memory/docs/docs-migration-plan.md`
- `maestro/memory/docs/docs-memory-score-audit.md`
- `maestro/memory/docs/frontend/README.md`
- `maestro/memory/docs/frontend/doc-map.md`
- `maestro/memory/docs/frontend/drift-report.md`
- `maestro/memory/docs/backend/README.md`
- `maestro/memory/docs/backend/doc-map.md`
- `maestro/memory/docs/backend/drift-report.md`
- `docs/ref/reference-code.md`
- `maestro/memory/reference-code/packs-index.md`
- `maestro/memory/reference-code/relocation-plan.md`
- `maestro/archive/final-atlas/README.md`
- `docs/archive/memory-reorg/README.md`

## Rule

Use `docs-memory-score-audit.md` for current readiness.
Use `docs-migration-plan.md` as historical migration record only.
Use compact maps to plan the tracked docs rewrite.
Do not physically move tracked docs until a rewrite task explicitly names the target slice.
Use `reference-pack:*` aliases when planning raw reference-code relocation.
Run `python3 scripts/ai/docs_memory_check.py --check` before committing docs or memory reorganizations.
CI also runs the same gate through `.github/workflows/docs-memory-check.yml`.
