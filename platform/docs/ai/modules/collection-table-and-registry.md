# Retired Module Memory - Collection Table And Registry

Status: retired legacy module pointer
Retired on: 2026-04-25

This old combined module is no longer an active memory source.

Read instead:

- `ai-memory/modules/domains/collection-table/README.md`
- `ai-memory/modules/domains/admin-module-registry/README.md`
- `ai-memory/modules/domains/admin-control-plane/README.md`

Tracked docs owners:

- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

Reason:

- Collection Table is the reusable table runtime/package domain.
- Admin Module Registry is a control-plane consumer.
- The registry may consume Collection Table, but it does not own the table contract.

Historical content from this file was compacted into `ai-memory/`.
Do not update this file with new product state.

For provenance, use git history or:

- `ai-memory/durable/legacy-memory-import.md`
