# Atlas Modernization Audit

Status: final migration audit
Last updated: 2026-04-25

This audit maps the old `platform/docs/ai` Atlas workflow to the new
`ai-memory` and `ai-memory/atlas` structure.

## Target Boundary

- Durable product memory: `ai-memory/durable/**` and `ai-memory/modules/**`.
- Memory routing: `ai-memory/index/memory-index.yaml` and `ai-memory/index/read-routes.yaml`.
- Atlas operational prompts/templates: `ai-memory/atlas/prompts/**` and `ai-memory/atlas/templates/**`.
- Atlas automation metadata: `ai-memory/atlas/automation-manifest.json` and `ai-memory/atlas/automation-changelog.md`.
- New run artifacts: `ai-memory/runs/active/<task-id>/`.
- Closed run artifacts: `ai-memory/runs/archive/<task-id>/`.
- Mechanical scripts: `scripts/ai/new-run.py`, `scripts/ai/new-run.sh`, and `scripts/ai/automation_versions.py`.

## Source Mapping

| Old source | New role | New target | Current action |
| --- | --- | --- | --- |
| `platform/docs/ai/current-state.md` | retired state pointer | `ai-memory/durable/current-state.md` | deleted after migration |
| `platform/docs/ai/decisions-log.md` | retired decision pointer | `ai-memory/durable/decisions-log.md` | deleted after migration |
| `platform/docs/ai/canonical-docs.md` | retired docs authority pointer | `ai-memory/durable/canonical-docs.md` | deleted after migration |
| `platform/docs/ai/module-index.md` | retired module routing pointer | `ai-memory/durable/module-index.md` and `ai-memory/index/*` | deleted after migration |
| `platform/docs/ai/modules/*.md` | retired module pointers | `ai-memory/modules/domains/**` plus FE/BE module packs | deleted after migration |
| `platform/docs/ai/prompts/*.md` | retired prompt pointers | `ai-memory/atlas/prompts/*.md` | deleted after migration |
| `platform/docs/ai/templates/*.md` | retired template pointers | `ai-memory/atlas/templates/*.md` | deleted after migration |
| `platform/docs/ai/automation-manifest.json` | retired JSON pointer | `ai-memory/atlas/automation-manifest.json` | deleted after migration |
| `platform/docs/ai/automation-changelog.md` | retired changelog pointer | `ai-memory/atlas/automation-changelog.md` | deleted after migration |
| `platform/docs/ai/runs/**` | retired run payloads | `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` | raw payloads deleted after summary acceptance |
| `scripts/ai/new-run.py` | run scaffolder | unchanged script path, new output target | updated to write `ai-memory/runs/active` |
| `scripts/ai/automation_versions.py` | version sync | unchanged script path, new manifest target | updated to read `ai-memory/atlas/automation-manifest.json` |

## Active Rules

- New Atlas runs must not be written to `platform/docs/ai/runs/**`.
- New prompt/template edits must not be written to `platform/docs/ai/prompts/**` or `platform/docs/ai/templates/**`.
- The former `platform/docs/ai/**` path must not be recreated. Use `ai-memory/durable/legacy-memory-import.md`, compact archive summaries, and git history only for explicit provenance recovery.
- FE/BE lane prompts may propose memory deltas, but Atlas owns final updates to `ai-memory` and tracked canonical docs.
- If a task changes a real product contract, update the tracked FE/BE doc owner as well as compact memory.

## Remaining Retirement Work

- None for `platform/docs/ai/**`; final pointer-directory deletion has landed.

Landed cleanup:

- `platform/docs/ai/README.md`, `prompts/README.md`, `templates/README.md`, and `runs/README.md` were retired pointers before final deletion.
- `docs/ref/**` now contains stable reference registries only; memory reorganization brainstorms moved to `docs/archive/memory-reorg/`.
- Legacy runs are summarized in `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md`; old raw run payloads were deleted.
- Top-level durable/governance/changelog markdown files under `platform/docs/ai/*.md` were retired pointers to `ai-memory` before final deletion.
- Legacy module markdown files under `platform/docs/ai/modules/*.md` were retired pointers to `ai-memory/modules/**` and tracked FE/BE docs before final deletion.
- Legacy prompt/template markdown files and `platform/docs/ai/automation-manifest.json` were retired pointers to `ai-memory/atlas/**` before final deletion.
- Final readiness audit is recorded in `ai-memory/atlas/platform-docs-ai-retirement-readiness.md`; physical deletion is complete.
- Remaining `platform/docs/ai/**` pointer files were deleted after active reference checks.

The detailed retirement plan lives in:

- `ai-memory/atlas/platform-docs-ai-retirement-plan.md`
