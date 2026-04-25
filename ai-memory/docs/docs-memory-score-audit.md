# Docs And Memory Score Audit

Status: active score audit
Last audited: 2026-04-25

## Result

Overall docs/memory readiness score: 99/100.

This score means the repository is ready for normal AI-agent work through
`ai-memory`, active FE/BE docs, AGENTS instructions, and Atlas workflow files.
It does not mean every historical exact-detail document has been deleted.

## Verified Signals

- FE docs root contains only `platform/frontend/docs/README.md`.
- BE docs root contains only `platform/backend/docs/README.md`.
- `docs/ref/` contains only stable reference registry docs: `README.md` and `reference-code.md`.
- `platform/docs/ai/**` is absent from the working tree.
- `ai-memory/AGENTS.override.md` is absent from the working tree.
- Tracked FE/BE docs do not contain compacted/moved/no-longer-active pointer markers.
- Form Builder deleted exact-detail docs are no longer referenced from tracked frontend docs as read targets.
- Form Builder exact-detail audit has `14 keep_exact_detail`, `0 compact_more_then_delete`, and `9 deleted_after_payload_extraction`.
- `scripts/ai/automation_versions.py --check` is the active Atlas automation metadata sync check.
- `scripts/ai/docs_memory_check.py --check` is the active docs/memory drift and local markdown-link check.
- `.github/workflows/docs-memory-check.yml` runs docs/memory drift and Atlas automation version checks on relevant PRs and pushes.
- Old reference-code pointer README directories under FE/BE docs were deleted; tracked docs now use `reference-pack:*` aliases and local-only `reference-code/**` raw-pack paths.

## Scores

| Area | Score | Reason |
| --- | ---: | --- |
| AI memory routing | 98 | `ai-memory/index`, durable memory, module packs, and Atlas workflow now own active AI retrieval. |
| Legacy memory retirement | 100 | `platform/docs/ai/**` was migrated, summarized, and physically deleted. |
| FE docs structure | 98 | Active docs now route through `contracts/`, `modules/`, `guides/`, `proposals/`, `reference/`, and archive metadata; old root pointers and reference pointer folders are gone. |
| BE docs structure | 98 | Active backend docs route through contracts/modules/runbooks/proposals/reference/archive; old root pointers and reference pointer folders are gone. |
| Form Builder compaction | 93 | Hot Form Builder truth is compacted; 14 retained exact-detail docs remain by policy for exact payload/history. |
| Reference-code governance | 99 | Raw packs moved to ignored `reference-code/`; tracked docs use `reference-pack:*` aliases and old pointer README folders were deleted. |
| Atlas/Codex-local workflow | 99 | Atlas uses `ai-memory` and active prompts/templates; docs/memory drift now has both local and CI checks. |

## Remaining Work To Reach 100

- Replace retained Form Builder exact-detail prose with typed schemas, tests, generated registries, or code-backed docs where practical.
- Add a lightweight scheduled run for docs/memory drift instead of relying only on manual invocation.
- Keep future module work disciplined: every new durable decision should update `ai-memory/durable/decisions-log.md`, `current-state.md`, the relevant module pack, and the tracked doc owner.

## Current Policy

Normal AI-agent work should start from:

1. `AGENTS.md`
2. task-relevant `.agents/skills/**` or `.codex/**`
3. `ai-memory/index/*`
4. `ai-memory/durable/current-state.md`
5. the relevant module pack under `ai-memory/modules/**`
6. active tracked docs under `platform/frontend/docs/**` or `platform/backend/docs/**`

Do not use deleted legacy paths as read targets. Use git history only for
explicit provenance recovery.
