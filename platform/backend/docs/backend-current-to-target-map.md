# Backend Current-To-Target Map

Status: compatibility pointer
Owner: backend
Last audited: 2026-04-25
Canonical scope: old path for backend current-to-target map

This document has been compacted into:

- `platform/backend/docs/modules/runtime.md`

Use the new module doc for current backend runtime shape.

Current summary:

- Active runtimes are `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, and `cmd/migrate`.
- `cmd/worker` is future/deferred.
- `cmd/scapi` is retired.
- Backend remains a modular monolith.
- PostgreSQL is the target runtime database.
- Cognito is not the target auth model.
