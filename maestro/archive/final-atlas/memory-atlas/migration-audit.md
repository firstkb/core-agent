# Atlas Modernization Audit

Status: final migration audit
Last updated: 2026-04-25

This audit maps the old `platform/docs/ai` Atlas workflow to the new
`maestro/memory` and `maestro/memory/atlas` structure.

## Target Boundary

- Durable product memory: `maestro/memory/durable/**` and `maestro/memory/modules/**`.
- Memory routing: `maestro/memory/index/memory-index.yaml` and `maestro/memory/index/read-routes.yaml`.
- Atlas operational prompts/templates: `maestro/memory/atlas/prompts/**` and `maestro/memory/atlas/templates/**`.
- Atlas automation metadata: `maestro/memory/atlas/automation-manifest.json` and `maestro/memory/atlas/automation-changelog.md`.
- New run artifacts: `maestro/memory/runs/active/<task-id>/`.
- Closed run artifacts: `maestro/memory/runs/archive/<task-id>/`.
- Mechanical scripts: `scripts/ai/new-run.py`, `scripts/ai/new-run.sh`, and `scripts/ai/automation_versions.py`.

## Source Mapping

| Old source | New role | New target | Current action |
| --- | --- | --- | --- |
| `platform/docs/ai/current-state.md` | retired state pointer | `maestro/memory/durable/current-state.md` | deleted after migration |
| `platform/docs/ai/decisions-log.md` | retired decision pointer | `maestro/memory/durable/decisions-log.md` | deleted after migration |
| `platform/docs/ai/canonical-docs.md` | retired docs authority pointer | `maestro/memory/durable/canonical-docs.md` | deleted after migration |
| `platform/docs/ai/module-index.md` | retired module routing pointer | `maestro/memory/durable/module-index.md` and `maestro/memory/index/*` | deleted after migration |
| `platform/docs/ai/modules/*.md` | retired module pointers | `maestro/memory/modules/domains/**` plus FE/BE module packs | deleted after migration |
| `platform/docs/ai/prompts/*.md` | retired prompt pointers | `maestro/memory/atlas/prompts/*.md` | deleted after migration |
| `platform/docs/ai/templates/*.md` | retired template pointers | `maestro/memory/atlas/templates/*.md` | deleted after migration |
| `platform/docs/ai/automation-manifest.json` | retired JSON pointer | `maestro/memory/atlas/automation-manifest.json` | deleted after migration |
| `platform/docs/ai/automation-changelog.md` | retired changelog pointer | `maestro/memory/atlas/automation-changelog.md` | deleted after migration |
| `platform/docs/ai/runs/**` | retired run payloads | `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md` | raw payloads deleted after summary acceptance |
| `scripts/ai/new-run.py` | run scaffolder | unchanged script path, new output target | updated to write `maestro/memory/runs/active` |
| `scripts/ai/automation_versions.py` | version sync | unchanged script path, new manifest target | updated to read `maestro/memory/atlas/automation-manifest.json` |

## Active Rules

- New Atlas runs must not be written to `platform/docs/ai/runs/**`.
- New prompt/template edits must not be written to `platform/docs/ai/prompts/**` or `platform/docs/ai/templates/**`.
- The former `platform/docs/ai/**` path must not be recreated. Use `maestro/memory/durable/legacy-memory-import.md`, compact archive summaries, and git history only for explicit provenance recovery.
- FE/BE lane prompts may propose memory deltas, but Atlas owns final updates to `maestro/memory` and tracked canonical docs.
- If a task changes a real product contract, update the tracked FE/BE doc owner as well as compact memory.

## Remaining Retirement Work

- None for `platform/docs/ai/**`; final pointer-directory deletion has landed.

Landed cleanup:

- `platform/docs/ai/README.md`, `prompts/README.md`, `templates/README.md`, and `runs/README.md` were retired pointers before final deletion.
- `docs/ref/**` now contains stable reference registries only; memory reorganization brainstorms moved to `docs/archive/memory-reorg/`.
- Legacy runs are summarized in `maestro/memory/runs/archive/legacy-platform-docs-ai-runs.md`; old raw run payloads were deleted.
- Top-level durable/governance/changelog markdown files under `platform/docs/ai/*.md` were retired pointers to `maestro/memory` before final deletion.
- Legacy module markdown files under `platform/docs/ai/modules/*.md` were retired pointers to `maestro/memory/modules/**` and tracked FE/BE docs before final deletion.
- Legacy prompt/template markdown files and `platform/docs/ai/automation-manifest.json` were retired pointers to `maestro/memory/atlas/**` before final deletion.
- Final readiness audit is recorded in `maestro/memory/atlas/platform-docs-ai-retirement-readiness.md`; physical deletion is complete.
- Remaining `platform/docs/ai/**` pointer files were deleted after active reference checks.

The detailed retirement plan lives in:

- `maestro/memory/atlas/platform-docs-ai-retirement-plan.md`
