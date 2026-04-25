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

These old root docs remain as compatibility pointers during the migration:

- `backend-current-to-target-map.md`
- `backend-module-wiring-standard.md`
- `backend-internal-foundation-matrix.md`

## Auth And Session

Active docs:

- `contracts/auth-gateway.md`
- `contracts/auth-control-schema.md`
- `modules/auth.md`
- `auth/auth-key-source-configuration.md`

Supporting docs:

- `backend-db-instance-secret-resolution.md`
- `auth/auth-kms-implementation-status.md`

Compatibility pointers:

- `backend-auth-gateway-contract.md`
- `backend-auth-control-table-design.md`
- `backend-auth-projection-and-sync.md`

## Admin Control Plane

Active docs:

- `contracts/admin-control-plane.md`
- `contracts/admin-module-registry.md`

Supporting docs:

- `backend-api-gateway-http-api-mapping-spec.md`
- `backend-api-gateway-proxy-routing-policy.md`
- `backend-admin-tenant-events-mails-overlap-audit-v1.md`

Note:

- `contracts/admin-module-registry.md` owns Module Registry control-plane context.
- Generic Collection Table behavior belongs to `contracts/collection-table.md`.

Compatibility pointers:

- `backend-admin-module-registry-brief.md`
- `backend-admin-access-policy-layering.md`

## Schema And Tenancy

Active docs:

- `contracts/schema-tenancy.md`
- `contracts/migrations.md`
- `backend-tenant-canonical-field-mapping-v1.md`
- `backend-tenant-import-module-boundary-v1.md`

Supporting docs:

- `backend-schema-drift-check-strategy.md`
- `backend-db-instance-secret-resolution.md`

Compatibility pointers:

- `backend-schema-master-baseline.md`
- `backend-schema-tenant-baseline.md`
- `backend-schema-migrations-baseline.md`
- `backend-schema-placement-and-naming.md`
- `backend-tenant-canonical-refactor-contract-v1.md`

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

Frontend compatibility pointers:

- `platform/frontend/docs/platform-studio/form-builder-backend*.md`
- `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md`

## Working Or Historical Docs

Read only when the task explicitly needs rationale or rollout history:

- `backend-admin-module-registry-refactor-plan.md`
- `backend-auth-cookie-migration-plan.md`
- `backend-tenant-starter-field-targets.md`
- `ramp_v_108_backend_standard_v_2.md`
- `GO_AGENT_RULES.md`
- `backend-export-architecture-agent-prompt.md`
- `legacy/**`

Legacy MSSQL schema files under `MSSQL/**` are reference-code material only.
Use `docs/ref/reference-code.md` and alias `reference-pack:mssql-legacy-schema` before opening them.
