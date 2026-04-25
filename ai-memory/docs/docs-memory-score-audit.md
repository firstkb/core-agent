# Docs And Memory Score Audit

Status: active score audit
Last audited: 2026-04-25

## Result

Overall docs/memory readiness score: 96/100.

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

## Scores

| Area | Score | Reason |
| --- | ---: | --- |
| AI memory routing | 98 | `ai-memory/index`, durable memory, module packs, and Atlas workflow now own active AI retrieval. |
| Legacy memory retirement | 100 | `platform/docs/ai/**` was migrated, summarized, and physically deleted. |
| FE docs structure | 96 | Active docs now route through `contracts/`, `modules/`, `guides/`, `proposals/`, `reference/`, and archive metadata; old root pointers are gone. |
| BE docs structure | 97 | Active backend docs route through contracts/modules/runbooks/proposals/reference/archive; old root pointers are gone. |
| Form Builder compaction | 93 | Hot Form Builder truth is compacted; 14 retained exact-detail docs remain by policy for exact payload/history. |
| Reference-code governance | 97 | Raw packs moved to ignored `reference-code/`; tracked docs use `reference-pack:*` aliases. |
| Atlas/Codex-local workflow | 95 | Atlas uses `ai-memory` and active prompts/templates; remaining improvement is periodic drift automation rather than more manual docs. |

## Remaining Work To Reach 100

- Add an automated link/reference check for docs and `ai-memory` routes.
- Replace retained Form Builder exact-detail prose with typed schemas, tests, generated registries, or code-backed docs where practical.
- Add a lightweight scheduled drift check for stale lifecycle language in retained exact-detail/reference-only docs.
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
