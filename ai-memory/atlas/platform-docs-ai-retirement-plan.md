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
| `platform/docs/ai/current-state.md` | retired pointer | `ai-memory/durable/current-state.md` | pointer landed |
| `platform/docs/ai/decisions-log.md` | retired pointer | `ai-memory/durable/decisions-log.md` | pointer landed |
| `platform/docs/ai/canonical-docs.md` | retired pointer | `ai-memory/durable/canonical-docs.md` | pointer landed |
| `platform/docs/ai/repo-map.md` | retired pointer | `ai-memory/durable/repo-map.md` | pointer landed |
| `platform/docs/ai/platform-contract.md` | retired pointer | `ai-memory/durable/platform-contract.md` | pointer landed |
| `platform/docs/ai/module-index.md` | retired pointer | `ai-memory/durable/module-index.md` and `ai-memory/index/*` | pointer landed |
| `platform/docs/ai/modules/*.md` | retired module pointers | `ai-memory/modules/domains/**` plus FE/BE module packs | pointer landed |
| `platform/docs/ai/markdown-governance.md` | retired pointer | `ai-memory/agent-workflow.md`, `platform/AGENTS.md`, tracked docs style rules | pointer landed |
| `platform/docs/ai/orchestration-boundaries.md` | retired pointer | `ai-memory/atlas/README.md`, `.agents/skills/ramp-conductor/SKILL.md` | pointer landed |
| `platform/docs/ai/prompts/**` | retired prompt pointers | `ai-memory/atlas/prompts/**` | pointer landed |
| `platform/docs/ai/templates/**` | retired template pointers | `ai-memory/atlas/templates/**` | pointer landed |
| `platform/docs/ai/automation-manifest.json` | retired JSON pointer | `ai-memory/atlas/automation-manifest.json` | pointer landed |
| `platform/docs/ai/automation-changelog.md` | retired pointer | `ai-memory/atlas/automation-changelog.md` | pointer landed |
| `platform/docs/ai/runs/**` | retired run pointer | `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` | raw payloads deleted |

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
- Old raw run payloads are deleted after compact summary acceptance.

## Next Slices

1. Legacy run triage: landed in `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` and `ai-memory/atlas/legacy-runs-triage.md`.
2. Legacy durable memory pointer pass: landed for top-level `platform/docs/ai/*.md` durable/governance/changelog files.
3. Legacy operational payload pass: landed for old prompts, templates, and automation manifest.
4. Final readiness audit: landed in `ai-memory/atlas/platform-docs-ai-retirement-readiness.md`.
5. Legacy run payload cleanup: landed; raw run payloads were deleted after compact summary acceptance.
6. Final pointer-directory decision: keep compatibility pointers for one more cycle or remove `platform/docs/ai/**` entirely.

## Final Readiness

The final readiness audit lives in:

- `ai-memory/atlas/platform-docs-ai-retirement-readiness.md`

Current verdict:

- Hot-read retirement is complete.
- Legacy run payload cleanup is complete.
- Physical deletion of the remaining pointer directories is now a separate compatibility decision.
