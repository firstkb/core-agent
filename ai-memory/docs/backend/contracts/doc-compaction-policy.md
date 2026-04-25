# Backend Docs Compaction Policy

Status: active local policy
Last compacted: 2026-04-25

The backend docs corpus is useful, but many files are plans, audits, or historical standards.
Agents should retrieve the smallest stable slice needed for a task.

## Classification

- `hot contract`: active source doc that can guide implementation after code verification.
- `supporting contract`: useful for a narrow domain but not part of the default read path.
- `working plan`: phase/task material; read only for that migration or unresolved work.
- `proposed`: architecture direction not live by itself.
- `historical`: old standard, prompt, archive, or completed plan.

## Promotion Rules

- Stable runtime facts go into the relevant `ai-memory/modules/backend/*` or `ai-memory/modules/domains/*` contract/state files.
- Current uncertainty goes into the relevant module `state.md` or the backend drift report.
- Repeated implementation lessons go into the relevant module `lessons.md`.
- Physical-doc cleanup candidates go into `ai-memory/docs/backend/archive/archive-candidates.md`.
- Large source docs should be summarized as references, not copied into compact memory.

## Default Backend Reads

For backend implementation tasks, read:

- `ai-memory/modules/backend/runtime/README.md`
- The exact domain/backend module pack for the domain.
- `ai-memory/docs/backend/doc-map.md` only when choosing tracked source docs.
- `ai-memory/docs/backend/drift-report.md` when a tracked source doc looks old or plan-shaped.

Avoid by default:

- `platform/backend/docs/archive/**`
- `platform/backend/docs/legacy/**`
- `platform/backend/docs/archive/postgres-archive/**`
- completed refactor plans unless investigating history

Old root archive pointer files for Go rules, RAMP standard, and export prompt
were deleted after compaction. Use `platform/backend/docs/archive/**` or git
history only for explicit history tasks.

## Rewrite Rules For Later Docs Reorg

- Keep one active backend docs index.
- Keep one runtime/wiring contract.
- Keep one auth contract pack.
- Keep one schema/tenancy contract pack.
- Keep one admin control-plane contract pack.
- Move completed plans, prompts, and legacy archives out of the active docs path.
- Remove machine-local links from tracked docs during the rewrite.
