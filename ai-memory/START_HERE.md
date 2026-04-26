# AI Memory Start Here

Status: active first-read memory
Scope: compact routing for platform product agents
Last updated: 2026-04-25

## Current Objective

- Build Ramp Platform v108 as an online web product first.
- Keep admin and tenant web surfaces moving without losing product decisions.
- Use future PWA/offline, Flutter/mobile, and heavy automation docs only when explicitly routed.

## Memory Role

- `ai-memory/` is compact routing, durable state, and agent workflow memory.
- It is not a replacement for source code.
- It is not a replacement for tracked canonical frontend/backend docs.
- If memory conflicts with code or canonical docs, verify against the owner surface.

## Canonical Docs

- Frontend canonical docs live under `platform/frontend/docs/**`.
- Backend canonical docs live under `platform/backend/docs/**`.
- Repo/runtime agent rules live in `AGENTS.md`, `platform/AGENTS.md`, `.agents/**`, and `.codex/**`.
- Historical legacy memory from `platform/docs/ai/**` is deleted and recoverable only through summaries or git history.

## Default Read Order

1. `AGENTS.md`
2. `platform/AGENTS.md`
3. `ai-memory/START_HERE.md`
4. `ai-memory/index/read-routes.yaml`
5. `ai-memory/durable/current-state.md`
6. relevant module memory under `ai-memory/modules/**`
7. relevant canonical FE/BE docs
8. exact source files needed for the task

Read `ai-memory/index/memory-index.yaml` when you need a broader route map or
the task spans multiple modules.

## Active Surfaces

- Frontend workspace: `platform/frontend/`
- Backend workspace: `platform/backend/`
- Admin web app: `platform/frontend/apps/platform-admin-web`
- Tenant web app: `platform/frontend/apps/tenant-web`
- Platform Studio suite: tenant-facing builder/configuration tools.
- Form Builder: active Platform Studio tool.
- Auth/session: cross-stack cookie refresh, access token, profile, and tenant bootstrap.
- Schema/tenancy: backend-owned migrations and tenant database boundaries.

## Platform Studio Boundary

- Platform Studio is not only Form Builder.
- Form Builder is active.
- Navigation Builder, Action Builder, PDF Builder, and Report Builder are planned tools.
- Do not implement planned tool concerns inside Form Builder without an accepted boundary update.
- Form Builder planned/open work lives in `ai-memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`.

## Run Artifacts

- Active local run packets go under `ai-memory/runs/active/<task-id>/`.
- Closed reusable run summaries go under `ai-memory/runs/archive/`.
- Temporary notes belong in the run folder, not canonical docs.
- Do not recreate `platform/docs/ai/runs/**`.

## Never Default-Read

- `reference-code/**`
- `platform/docs/archive/**`
- old closed runs
- raw vendor/reference packs
- retained Form Builder exact-detail docs
- backend archive/legacy SQL
- git history

Open these only when a route, module pack, or owner request explicitly requires them.

## Memory Updates

- New durable product decision: update `ai-memory/durable/decisions-log.md` and `ai-memory/durable/current-state.md`.
- New module/runtime/app/tool: update `ai-memory/durable/module-index.md`, `repo-map.md`, module memory, and read routes.
- New frontend contract: update `platform/frontend/docs/contracts/**`.
- New backend contract: update `platform/backend/docs/contracts/**`.
- New verified lesson after an error: update the relevant `lessons.md` or `ai-memory/lessons/**`.
- No memory update needed: say so explicitly in the closeout.

## Memory Size Rule

- `ai-memory/modules/**` is for durable, compressed, operationally useful facts.
- Do not copy full FE/BE docs into module memory.
- Do not copy implementation details that are easier to verify in code.
- Do not preserve historical debates in hot memory.
- Use archive docs or git history only for provenance.

## Required Checks For Docs/Memory Work

```bash
python3 scripts/ai/docs_memory_check.py --check
python3 scripts/ai/check-env-policy.py --check
python3 scripts/ai/automation_versions.py --check
```

Use Scribe manually after large docs/memory changes or before a major development phase.
Do not run Scribe on every commit by default.
