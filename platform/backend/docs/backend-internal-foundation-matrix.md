# Backend Internal Foundation Matrix

Status: compatibility pointer
Owner: backend
Last audited: 2026-04-25
Canonical scope: old path for backend internal foundation matrix

This document has been compacted into:

- `platform/backend/docs/modules/runtime.md`

Use the new module doc for current runtime shape and active foundation boundaries.

Current summary:

- Platform infrastructure belongs under `platform/backend/internal/platform`.
- Business logic belongs under `platform/backend/modules`.
- Root `internal/` should not gain new business packages.
- Active runtimes should prefer `internal/platform/*` infrastructure packages.
