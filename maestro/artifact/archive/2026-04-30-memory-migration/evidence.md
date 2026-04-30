# Evidence

## Checks

- `python3 scripts/ai/docs_memory_check.py --check`: passed.
- `python3 scripts/ai/automation_versions.py --check`: passed.
- `scripts/ai/preflight.sh`: passed in lite mode.

## Reference Review

- Active read-order paths now use `maestro/memory/START_HERE.md` and
  `maestro/memory/index/read-routes.yaml`.
- `scripts/ai/docs_memory_check.py` now rejects a restored `ai-memory/` root.
- Remaining `ai-memory` references are migration, archive, provenance, or
  retired-path guard references.

## Notes

- Product runtime code was not changed.
- Retired runtime provenance was later moved outside the active repository.
