# Backend Docs

Status: active index
Owner: backend
Last audited: 2026-04-25
Canonical scope: tracked backend documentation entrypoint

This index points agents to the active backend docs set.
Read contract docs first, then module docs, then runbooks/proposals/reference/history only when the task requires them.

## Active Runtime Docs

- `contracts/runtime-wiring.md`: backend runtime composition, module wiring, route registration, and responsibility split.
- `contracts/collection-table.md`: backend shared Collection Table DTOs, query helpers, preferences, and current admin endpoint families.
- `contracts/events-identity.md`: event actor identity fields for master and tenant events.
- `contracts/platform-studio-form-builder.md`: backend Form Builder authoring API, metadata storage, runtime apply, generated objects, validation, and migration boundary.
- `modules/runtime.md`: current backend runtime shape, active entrypoints, module roots, and foundation boundaries.
- `modules/platform-studio/form-builder.md`: backend Form Builder implementation map and read order.

## Current Runtime Summary

- Active runtime entrypoints: `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, `cmd/migrate`.
- Deferred runtime: `cmd/worker`.
- Retired runtime: `cmd/scapi`.
- Backend remains a modular monolith.
- `cmd/migrate` owns schema migration execution.
- API startup must not run schema migrations.

## Compatibility Pointers

Pointer-only runtime map, foundation, and module wiring files were deleted after
compaction. Use active runtime docs or git history for exact old text.

## Auth And Session

Active docs:

- `contracts/auth-gateway.md`
- `contracts/auth-control-schema.md`
- `modules/auth.md`

Runbooks:

- `runbooks/auth-key-sources.md`
- `runbooks/db-instance-secret-resolution.md`

Proposals:

- `proposals/kms-signing.md`

Pointer-only auth gateway/control/projection/root/auth-path files were deleted
after compaction. Use active auth contracts/modules/runbooks/proposals or git
history for exact old text.

## Admin Control Plane

Active docs:

- `contracts/admin-control-plane.md`
- `contracts/admin-module-registry.md`

Proposals:

- `proposals/api-gateway-http-api-mapping.md`
- `proposals/api-gateway-proxy-routing.md`
- `proposals/events-mails-cleanup.md`

Note:

- `contracts/admin-module-registry.md` owns Module Registry control-plane context.
- Generic Collection Table behavior belongs to `contracts/collection-table.md`.

The old admin Module Registry brief and access-policy layering pointer-only
files were deleted after compaction. Use the active admin contracts or git
history for exact old text.

## Schema And Tenancy

Active docs:

- `contracts/schema-tenancy.md`
- `contracts/migrations.md`

Runbooks:

- `runbooks/local-bootstrap.md`
- `runbooks/db-instance-secret-resolution.md`

Reference docs:

- `reference/import-field-mapping.md`
- `reference/tenant-import-boundary.md`

Supporting docs:

- `proposals/schema-drift-checks.md`

Pointer-only schema baseline, migration baseline, placement/naming, and tenant
canonical/import/reference/drift root files were deleted after compaction. Use
active schema contracts, runbooks, reference docs, proposals, or git history for
exact old text.

## Platform Studio Form Builder

Active docs:

- `contracts/platform-studio-form-builder.md`
- `modules/platform-studio/form-builder.md`

Code owners:

- `modules/tenant/platformstudioformbuilder`
- `cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`

Read rule:

- Use `modules/platform-studio/form-builder.md` for implementation orientation.
- Use `contracts/platform-studio-form-builder.md` for API, storage, validation, generated-object, runtime apply, and migration-boundary rules.

Old frontend-owned backend-facing Form Builder pointer files were deleted after
backend facts were compacted into the backend contract. Use the backend contract
or git history for exact old text.

## Archive

Read only when the task explicitly needs rationale or rollout history:

- `archive/README.md`
- `archive/backend-admin-module-registry-refactor-plan.md`
- `archive/backend-auth-cookie-migration-plan.md`
- `archive/backend-tenant-starter-field-targets.md`
- `archive/ramp_v_108_backend_standard_v_2.md`
- `archive/GO_AGENT_RULES.md`
- `archive/backend-export-architecture-agent-prompt.md`
- `archive/postgres-archive/README.md`

Archive compatibility pointer, not active read-order doc:

- `legacy/postgres-archive/README.md`

Old root compatibility/archive pointer files were deleted after compaction.
Only the legacy PostgreSQL path remains as a narrow compatibility pointer.

Legacy MSSQL schema material is reference-code only.
Use `maestro/memory/reference-code/README.md` and alias `reference-pack:mssql-legacy-schema` before opening the local-only raw pack.

Legacy PostgreSQL SQL under `archive/postgres-archive/**` is historical archive/reference only.
It is not an active migration source.
