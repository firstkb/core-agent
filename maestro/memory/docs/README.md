# Documentation Memory

Status: compact docs governance layer
Last compacted: 2026-04-30

This folder contains compact maps and governance notes for tracked product docs.
The old FE/BE docs migration is complete; exact migration history lives in git
history only.

## Read This When

- planning a physical rewrite of `platform/frontend/docs`
- planning a physical rewrite of `platform/backend/docs`
- deciding whether a tracked doc is active, supporting, proposed, or historical
- preventing agents from reading large or stale docs by default

## Local Docs

- `maestro/memory/START_HERE.md`
- `maestro/memory/docs/target-docs-structure.md`
- `maestro/memory/docs/frontend/README.md`
- `maestro/memory/docs/frontend/doc-map.md`
- `maestro/memory/docs/frontend/drift-report.md`
- `maestro/memory/docs/backend/README.md`
- `maestro/memory/docs/backend/doc-map.md`
- `maestro/memory/docs/backend/drift-report.md`
- `maestro/memory/reference-code/README.md`
- `maestro/memory/reference-code/packs-index.md`
- `maestro/memory/reference-code/relocation-plan.md`
- `git history`

## Rule

Use compact maps to plan the tracked docs rewrite.
Do not physically move tracked docs until a rewrite task explicitly names the target slice.
Use `scripts/checks/docs_memory_check.py --check` and `scripts/preflight.sh`
for current readiness instead of score snapshots.
Use `reference-pack:*` aliases when planning raw reference-code relocation.
Run `python3 scripts/checks/docs_memory_check.py --check` before committing docs or memory reorganizations.
CI also runs the same gate through `.github/workflows/docs-memory-check.yml`.
