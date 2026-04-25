# Platform Docs AI Retirement Plan

Status: final retirement plan
Last updated: 2026-04-25

This plan records how `platform/docs/ai/**` was retired without losing useful
historical memory, Atlas prompts, templates, scripts, or run provenance.

## Goal

`platform/docs/ai/**` is no longer a source of active agent truth and has been
deleted from the working tree.
The active system is:

- `ai-memory/index/**` for retrieval routing
- `ai-memory/durable/**` for compact durable memory
- `ai-memory/modules/**` for domain/module memory
- `ai-memory/atlas/**` for Atlas operational prompts/templates/manifest
- `ai-memory/runs/active/**` and `ai-memory/runs/archive/**` for run artifacts

## Retirement Rules

- Do not delete payload until it has an active replacement or an explicit archive role.
- Do not keep duplicate active truth in both old and new locations.
- Keep old paths as short pointers only while downstream references still exist; delete them after active reference checks pass.
- Historical runs are provenance, not product truth.
- New Atlas work must not write to `platform/docs/ai/**`.

## Source Disposition

| Old path | Target role | Target path | Action |
| --- | --- | --- | --- |
| `platform/docs/ai/README.md` | retired pointer | `ai-memory/durable/legacy-memory-import.md` | deleted after reference scan |
| `platform/docs/ai/current-state.md` | retired pointer | `ai-memory/durable/current-state.md` | deleted after migration |
| `platform/docs/ai/decisions-log.md` | retired pointer | `ai-memory/durable/decisions-log.md` | deleted after migration |
| `platform/docs/ai/canonical-docs.md` | retired pointer | `ai-memory/durable/canonical-docs.md` | deleted after migration |
| `platform/docs/ai/repo-map.md` | retired pointer | `ai-memory/durable/repo-map.md` | deleted after migration |
| `platform/docs/ai/platform-contract.md` | retired pointer | `ai-memory/durable/platform-contract.md` | deleted after migration |
| `platform/docs/ai/module-index.md` | retired pointer | `ai-memory/durable/module-index.md` and `ai-memory/index/*` | deleted after migration |
| `platform/docs/ai/modules/*.md` | retired module pointers | `ai-memory/modules/domains/**` plus FE/BE module packs | deleted after migration |
| `platform/docs/ai/markdown-governance.md` | retired pointer | `ai-memory/agent-workflow.md`, `platform/AGENTS.md`, tracked docs style rules | deleted after migration |
| `platform/docs/ai/orchestration-boundaries.md` | retired pointer | `ai-memory/atlas/README.md`, `.agents/skills/ramp-conductor/SKILL.md` | deleted after migration |
| `platform/docs/ai/prompts/**` | retired prompt pointers | `ai-memory/atlas/prompts/**` | deleted after migration |
| `platform/docs/ai/templates/**` | retired template pointers | `ai-memory/atlas/templates/**` | deleted after migration |
| `platform/docs/ai/automation-manifest.json` | retired JSON pointer | `ai-memory/atlas/automation-manifest.json` | deleted after migration |
| `platform/docs/ai/automation-changelog.md` | retired pointer | `ai-memory/atlas/automation-changelog.md` | deleted after migration |
| `platform/docs/ai/runs/**` | retired run pointer | `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` | raw payloads and pointer directory deleted |

## Required Checks Before Final Deletion

Run these checks before deleting old paths:

```bash
rg -n "platform/docs/ai" AGENTS.md platform .agents scripts ai-memory docs
python3 scripts/ai/automation_versions.py --check
python3 scripts/ai/new-run.py --task-id 2026-04-25_research_retirement-dry-run --mode RESEARCH_CONTRACT_LOCK --dry-run
```

Expected state after deletion:

- AGENTS and Atlas skill do not route agents to read or write `platform/docs/ai/**`.
- Scripts read/write only `ai-memory/atlas/**` and `ai-memory/runs/**`.
- `ai-memory/index/read-routes.yaml` does not list deleted `platform/docs/ai/**` as a read route.
- Old raw run payloads and remaining pointer files are deleted after compact summary acceptance.

## Next Slices

1. Legacy run triage: landed in `ai-memory/runs/archive/legacy-platform-docs-ai-runs.md` and `ai-memory/atlas/legacy-runs-triage.md`.
2. Legacy durable memory pointer pass: landed for top-level `platform/docs/ai/*.md` durable/governance/changelog files.
3. Legacy operational payload pass: landed for old prompts, templates, and automation manifest.
4. Final readiness audit: landed in `ai-memory/atlas/platform-docs-ai-retirement-readiness.md`.
5. Legacy run payload cleanup: landed; raw run payloads were deleted after compact summary acceptance.
6. Final pointer-directory decision: landed; `platform/docs/ai/**` was removed entirely after active reference checks.

## Final Readiness

The final readiness audit lives in:

- `ai-memory/atlas/platform-docs-ai-retirement-readiness.md`

Current verdict:

- Hot-read retirement is complete.
- Legacy run payload cleanup is complete.
- Physical deletion of the remaining pointer directories is complete.
