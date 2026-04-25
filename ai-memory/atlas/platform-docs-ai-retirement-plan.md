# Platform Docs AI Retirement Plan

Status: active retirement plan
Last updated: 2026-04-25

This plan defines how to retire `platform/docs/ai/**` without losing useful
historical memory, Atlas prompts, templates, scripts, or run provenance.

## Goal

`platform/docs/ai/**` should stop being a source of active agent truth.
The active system is:

- `ai-memory/index/**` for retrieval routing
- `ai-memory/durable/**` for compact durable memory
- `ai-memory/modules/**` for domain/module memory
- `ai-memory/atlas/**` for Atlas operational prompts/templates/manifest
- `ai-memory/runs/active/**` and `ai-memory/runs/archive/**` for run artifacts

## Retirement Rules

- Do not delete payload until it has an active replacement or an explicit archive role.
- Do not keep duplicate active truth in both old and new locations.
- Keep old paths as short pointers only while downstream references still exist.
- Historical runs are provenance, not product truth.
- New Atlas work must not write to `platform/docs/ai/**`.

## Source Disposition

| Old path | Target role | Target path | Action |
| --- | --- | --- | --- |
| `platform/docs/ai/README.md` | retired pointer | same path | compact to pointer |
| `platform/docs/ai/current-state.md` | imported durable state provenance | `ai-memory/durable/current-state.md` | final pointer or archive after citation review |
| `platform/docs/ai/decisions-log.md` | imported decision provenance | `ai-memory/durable/decisions-log.md` | final pointer or archive after citation review |
| `platform/docs/ai/canonical-docs.md` | imported doc authority provenance | `ai-memory/durable/canonical-docs.md` | final pointer or archive after citation review |
| `platform/docs/ai/repo-map.md` | imported repo map provenance | `ai-memory/durable/repo-map.md` | final pointer or archive after citation review |
| `platform/docs/ai/platform-contract.md` | imported platform contract provenance | `ai-memory/durable/platform-contract.md` | final pointer or archive after citation review |
| `platform/docs/ai/module-index.md` | imported module index provenance | `ai-memory/durable/module-index.md` and `ai-memory/index/*` | final pointer or archive after citation review |
| `platform/docs/ai/modules/*.md` | imported domain memory provenance | `ai-memory/modules/domains/**` | final pointer or archive after citation review |
| `platform/docs/ai/markdown-governance.md` | governance provenance | `ai-memory/agent-workflow.md`, `platform/AGENTS.md`, tracked docs style rules | compact or archive |
| `platform/docs/ai/orchestration-boundaries.md` | Atlas provenance | `ai-memory/atlas/README.md`, `.agents/skills/ramp-conductor/SKILL.md` | compact or archive |
| `platform/docs/ai/prompts/**` | retired prompt provenance | `ai-memory/atlas/prompts/**` | pointer or delete after reference scan |
| `platform/docs/ai/templates/**` | retired template provenance | `ai-memory/atlas/templates/**` | pointer or delete after reference scan |
| `platform/docs/ai/automation-manifest.json` | retired version provenance | `ai-memory/atlas/automation-manifest.json` | pointer not possible for JSON; archive/delete after reference scan |
| `platform/docs/ai/automation-changelog.md` | retired changelog provenance | `ai-memory/atlas/automation-changelog.md` | archive or keep pointer |
| `platform/docs/ai/runs/**` | historical run provenance | `ai-memory/runs/archive/**` or summarized archive | triage per run |

## Required Checks Before Final Deletion

Run these checks before deleting old paths:

```bash
rg -n "platform/docs/ai" AGENTS.md platform .agents scripts ai-memory docs
python3 scripts/ai/automation_versions.py --check
python3 scripts/ai/new-run.py --task-id 2026-04-25_research_retirement-dry-run --mode RESEARCH_CONTRACT_LOCK --dry-run
```

Expected state before deletion:

- AGENTS and Atlas skill mention `platform/docs/ai/**` only as legacy provenance.
- Scripts read/write only `ai-memory/atlas/**` and `ai-memory/runs/**`.
- `ai-memory/index/read-routes.yaml` keeps `platform/docs/ai/**` in `avoid_by_default`.
- Old runs are either archived, summarized, or explicitly declared unnecessary.

## Next Slices

1. Legacy run triage: landed in `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` and `ai-memory/atlas/legacy-runs-triage.md`.
2. Legacy durable memory pointer pass: compact old durable files into short pointers after confirming imported decisions.
3. Legacy operational payload pass: replace or remove old prompts/templates/manifest/changelog after reference scan.
4. Final deletion pass: remove `platform/docs/ai/**` only after the repository has no active references.
