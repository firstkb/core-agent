# MSSQL Legacy Schema Reference Pack Pointer

Status: reference pointer
Owner: backend
Last audited: 2026-04-25
Canonical scope: compatibility pointer for relocated legacy schema source

The raw MSSQL legacy schema pack no longer lives in active backend docs.
Use `docs/ref/reference-code.md` and alias `reference-pack:mssql-legacy-schema`.

This material is opt-in reference only.
It is not product truth and must not be read by default.

Allowed use:

- legacy field interpretation
- import mapping support
- migration archaeology

Forbidden use:

- treating MSSQL schema as current backend schema truth
- bypassing current schema/tenancy and migration contracts
