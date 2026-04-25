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

These old root docs remain as compatibility pointers during the migration.
They are not part of the active read order:

- `backend-current-to-target-map.md`
- `backend-module-wiring-standard.md`
- `backend-internal-foundation-matrix.md`

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

Compatibility pointers, not active read-order docs:

- `backend-auth-gateway-contract.md`
- `backend-auth-control-table-design.md`
- `backend-auth-projection-and-sync.md`
- `auth/auth-key-source-configuration.md`
- `auth/auth-kms-implementation-status.md`

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

Compatibility pointers, not active read-order docs:

- `backend-admin-module-registry-brief.md`
- `backend-admin-access-policy-layering.md`

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

Compatibility pointers, not active read-order docs:

- `backend-schema-master-baseline.md`
- `backend-schema-tenant-baseline.md`
- `backend-schema-migrations-baseline.md`
- `backend-schema-placement-and-naming.md`
- `backend-tenant-canonical-refactor-contract-v1.md`
- `backend-tenant-canonical-field-mapping-v1.md`
- `backend-tenant-import-module-boundary-v1.md`
- `backend-schema-drift-check-strategy.md`

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

Frontend compatibility pointers, not active backend read-order docs:

- `platform/frontend/docs/platform-studio/form-builder-backend*.md`
- `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md`

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

Compatibility/archive pointers, not active read-order docs:

- `legacy/postgres-archive/README.md`

Compatibility pointers remain at old root/legacy paths for historical links.

Legacy MSSQL schema files under `MSSQL/**` are reference-code material only.
Use `docs/ref/reference-code.md` and alias `reference-pack:mssql-legacy-schema` before opening them.

Legacy PostgreSQL SQL under `archive/postgres-archive/**` is historical archive/reference only.
It is not an active migration source.
