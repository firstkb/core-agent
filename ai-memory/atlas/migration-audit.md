# Atlas Modernization Audit

Status: active migration audit
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
| `platform/docs/ai/current-state.md` | retired state pointer | `ai-memory/durable/current-state.md` | pointer landed |
| `platform/docs/ai/decisions-log.md` | retired decision pointer | `ai-memory/durable/decisions-log.md` | pointer landed |
| `platform/docs/ai/canonical-docs.md` | retired docs authority pointer | `ai-memory/durable/canonical-docs.md` | pointer landed |
| `platform/docs/ai/module-index.md` | retired module routing pointer | `ai-memory/durable/module-index.md` and `ai-memory/index/*` | pointer landed |
| `platform/docs/ai/modules/*.md` | retired module pointers | `ai-memory/modules/domains/**` plus FE/BE module packs | pointer landed |
| `platform/docs/ai/prompts/*.md` | Atlas prompt contracts | `ai-memory/atlas/prompts/*.md` | copied and updated to index-first read order |
| `platform/docs/ai/templates/*.md` | Atlas artifact templates | `ai-memory/atlas/templates/*.md` | copied; chat bootstrap updated to `ai-memory` |
| `platform/docs/ai/automation-manifest.json` | version source provenance | `ai-memory/atlas/automation-manifest.json` | active manifest moved |
| `platform/docs/ai/automation-changelog.md` | retired changelog pointer | `ai-memory/atlas/automation-changelog.md` | pointer landed |
| `platform/docs/ai/runs/**` | historical run provenance | `ai-memory/runs/archive/` after triage | not moved yet |
| `scripts/ai/new-run.py` | run scaffolder | unchanged script path, new output target | updated to write `ai-memory/runs/active` |
| `scripts/ai/automation_versions.py` | version sync | unchanged script path, new manifest target | updated to read `ai-memory/atlas/automation-manifest.json` |

## Active Rules

- New Atlas runs must not be written to `platform/docs/ai/runs/**`.
- New prompt/template edits must not be written to `platform/docs/ai/prompts/**` or `platform/docs/ai/templates/**`.
- `platform/docs/ai/**` may be opened only for provenance, conflict resolution, or final retirement migration.
- FE/BE lane prompts may propose memory deltas, but Atlas owns final updates to `ai-memory` and tracked canonical docs.
- If a task changes a real product contract, update the tracked FE/BE doc owner as well as compact memory.

## Remaining Retirement Work

- Triage old `platform/docs/ai/runs/**` into archive summaries or delete after confirming no active task depends on them.
- Decide whether old `platform/docs/ai/prompts/**` and `templates/**` payload files should become pointer stubs or be physically removed.
- Decide whether `platform/docs/ai/automation-manifest.json` should be removed after all scripts and docs use `ai-memory/atlas/automation-manifest.json`.

Landed cleanup:

- `platform/docs/ai/README.md`, `prompts/README.md`, `templates/README.md`, and `runs/README.md` are retired pointers.
- `docs/ref/**` now contains stable reference registries only; memory reorganization brainstorms moved to `docs/archive/memory-reorg/`.
- Legacy runs are triaged in `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md`; old run folders remain provenance only.
- Top-level durable/governance/changelog markdown files under `platform/docs/ai/*.md` are retired pointers to `ai-memory`.
- Legacy module markdown files under `platform/docs/ai/modules/*.md` are retired pointers to `ai-memory/modules/**` and tracked FE/BE docs.

The detailed retirement plan lives in:

- `ai-memory/atlas/platform-docs-ai-retirement-plan.md`
