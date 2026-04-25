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
| `platform/docs/ai/current-state.md` | durable state provenance | `ai-memory/durable/current-state.md` | imported; old source legacy-only |
| `platform/docs/ai/decisions-log.md` | durable decision provenance | `ai-memory/durable/decisions-log.md` | imported; old source legacy-only |
| `platform/docs/ai/canonical-docs.md` | doc authority provenance | `ai-memory/durable/canonical-docs.md` | imported; old source legacy-only |
| `platform/docs/ai/module-index.md` | module routing provenance | `ai-memory/durable/module-index.md` and `ai-memory/index/*` | imported; old source legacy-only |
| `platform/docs/ai/modules/*.md` | domain memory provenance | `ai-memory/modules/domains/**` plus FE/BE module packs | imported; old source legacy-only |
| `platform/docs/ai/prompts/*.md` | Atlas prompt contracts | `ai-memory/atlas/prompts/*.md` | copied and updated to index-first read order |
| `platform/docs/ai/templates/*.md` | Atlas artifact templates | `ai-memory/atlas/templates/*.md` | copied; chat bootstrap updated to `ai-memory` |
| `platform/docs/ai/automation-manifest.json` | version source provenance | `ai-memory/atlas/automation-manifest.json` | active manifest moved |
| `platform/docs/ai/automation-changelog.md` | legacy changelog | `ai-memory/atlas/automation-changelog.md` | new changelog started; old changelog kept for history |
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
- Replace old `platform/docs/ai/README.md` with a short retired-surface pointer after all operational references are gone.
- Decide whether old `platform/docs/ai/prompts/**` and `templates/**` should become pointer stubs or be physically removed.
- Clean `docs/ref/**` so migration brainstorm files move to archive and `docs/ref/reference-code.md` remains the stable reference registry.
