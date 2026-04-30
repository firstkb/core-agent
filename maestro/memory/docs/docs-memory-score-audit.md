# Docs And Memory Score Audit

Status: active score audit
Last audited: 2026-04-25

## Result

Overall docs/memory readiness score: 99/100.

This score means the repository is ready for normal AI-agent work through
`maestro/memory`, active FE/BE docs, AGENTS instructions, and Atlas workflow files.
It does not mean every historical exact-detail document has been deleted.

## Verified Signals

- FE docs root contains only `platform/frontend/docs/README.md`.
- BE docs root contains only `platform/backend/docs/README.md`.
- `docs/ref/` contains only stable reference registry docs: `README.md` and `reference-code.md`.
- `platform/docs/ai/**` is absent from the working tree.
- `maestro/memory/AGENTS.override.md` is absent from the working tree.
- `maestro/memory/START_HERE.md` is the first compact memory read after repo/platform instructions.
- `platform/README.md` no longer lists `platform/docs/ai/**` as active layout.
- `maestro/memory/docs/docs-migration-plan.md` is historical; this score audit owns the current readiness score.
- Local backend env files are ignored and checked by `scripts/ai/check-env-policy.py --check`.
- Tracked FE/BE docs do not contain compacted/moved/no-longer-active pointer markers.
- Form Builder deleted exact-detail docs are no longer referenced from tracked frontend docs as read targets.
- Form Builder exact-detail audit has `14 keep_exact_detail`, `0 compact_more_then_delete`, and `9 deleted_after_payload_extraction`.
- Form Builder retained exact-detail replacement has a docs-only roadmap; no retained detail doc should be deleted before its replacement target and verification are explicit.
- Form Builder planned/open work has a dedicated code-verified memory doc, so import/runtime grants/preview guards/runtime create-edit-save/non-lookup multivalue/package-extraction work is not confused with implemented truth.
- `scripts/ai/automation_versions.py --check` is the active Atlas automation metadata sync check.
- `scripts/ai/docs_memory_check.py --check` is the active docs/memory drift, stale-layout, preflight-policy, and local markdown-link check.
- `scripts/ai/check-env-policy.py --check` is the active env-file policy check for `.gitignore` rules, tracked local env files, and sanitized env examples.
- `scripts/ai/preflight.sh` is the lightweight local/manual preflight for non-trivial implementation work; default mode runs hygiene plus quick agent-cli checks, and `--full` is explicit for broader backend/frontend checks.
- `maestro/memory/atlas/templates/agent-evidence.md` is the compact evidence template for non-trivial closeout or PR text; it is not a mandatory persistent artifact.
- Atlas direct no-run semantics are explicit: current-chat execution by default; separate FE/BE chats normally require a run, except owner-requested `MANUAL_HANDOFF_NO_RUN`.
- `.github/workflows/docs-memory-check.yml` runs docs/memory drift, env policy, and Atlas automation version checks on relevant PRs and pushes.
- `.agents/skills/archivist/SKILL.md` provides manual semantic docs/memory audit guidance for drift that deterministic checks cannot prove.
- Old reference-code pointer README directories under FE/BE docs were deleted; tracked docs now use `reference-pack:*` aliases and local-only `reference-code/**` raw-pack paths.

## Scores

| Area | Score | Reason |
| --- | ---: | --- |
| AI memory routing | 99 | `maestro/memory/START_HERE.md`, `maestro/memory/index`, durable memory, module packs, and Atlas workflow now own active AI retrieval. |
| Legacy memory retirement | 100 | `platform/docs/ai/**` was migrated, summarized, and physically deleted. |
| FE docs structure | 98 | Active docs now route through `contracts/`, `modules/`, `guides/`, `proposals/`, `reference/`, and archive metadata; old root pointers and reference pointer folders are gone. |
| BE docs structure | 98 | Active backend docs route through contracts/modules/runbooks/proposals/reference/archive; old root pointers and reference pointer folders are gone. |
| Form Builder compaction | 93 | Hot Form Builder truth is compacted; 14 retained exact-detail docs remain by policy for exact payload/history. |
| Reference-code governance | 99 | Raw packs moved to ignored `reference-code/`; tracked docs use `reference-pack:*` aliases and old pointer README folders were deleted. |
| Atlas/Codex-local workflow | 99 | Atlas uses `maestro/memory` and active prompts/templates; docs/memory drift now has both local and CI checks. |

## Remaining Work To Reach 100

- Execute retained Form Builder exact-detail replacements only through explicit implementation slices that name replacement target and verification.
- Use Archivist manually after large docs/memory changes and before major development phases; do not run it on every commit by default.
- Keep future module work disciplined: every new durable decision should update `maestro/memory/durable/decisions-log.md`, `current-state.md`, the relevant module pack, and the tracked doc owner.

## Current Policy

Normal AI-agent work should start from:

1. `AGENTS.md`
2. task-relevant `.agents/skills/**` or `.codex/**`
3. `maestro/memory/START_HERE.md`
4. `maestro/memory/index/read-routes.yaml`
5. `maestro/memory/durable/current-state.md`
6. the relevant module pack under `maestro/memory/modules/**`
7. active tracked docs under `platform/frontend/docs/**` or `platform/backend/docs/**`

Do not use deleted legacy paths as read targets. Use git history only for
explicit provenance recovery.
