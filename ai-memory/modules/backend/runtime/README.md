# Backend Runtime

Status: active compact backend pack
Owner surface: backend runtime and module wiring
Last compacted: 2026-04-25

## Read This When

- changing backend entrypoints or route wiring
- changing module wiring standards
- deciding where backend logic belongs

## Owner Sources

- `platform/backend/AGENTS.md`
- `platform/backend/README.md`
- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/modules/runtime.md`

Historical import context lives in `ai-memory/durable/legacy-memory-import.md`; the old `platform/docs/ai/**` path has been deleted.

## Current Runtimes

- `cmd/api-admin`
- `cmd/api-tenant`
- `cmd/auth`
- `cmd/migrate`

## Contract

- Backend is a modular monolith.
- Handlers stay thin.
- Business logic belongs in services.
- Persistence belongs in repositories or platform storage layers.
- Module wiring stays in `cmd/<app>/internal/server`.
- Keep admin and tenant semantics explicit.
- Do not add `cmd/worker` behavior until the runtime exists in code.
- Prefer `platform/backend/docs/contracts/runtime-wiring.md` over the old `backend-module-wiring-standard.md` path.
- Prefer `platform/backend/docs/modules/runtime.md` over the old `backend-current-to-target-map.md` and `backend-internal-foundation-matrix.md` paths.

## Lessons

- Do not put SQL in handlers.
- Do not leak transport DTOs into repositories.
- Do not create broad runtime aliases without explicit migration plan.
