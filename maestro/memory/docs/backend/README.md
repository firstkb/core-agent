# Backend Memory Docs

Status: local compact index
Last audited: 2026-04-25

Use this folder to choose the smallest useful backend doc set.
Do not mirror the entire `platform/backend/docs` corpus here.

## Target Rewrite

- `maestro/memory/docs/target-docs-structure.md`

## Migrated Runtime Source Docs

- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/contracts/events-identity.md`
- `platform/backend/docs/modules/runtime.md`

## Migrated Auth Source Docs

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`

## Migrated Schema Source Docs

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`

## Migrated Runbook, Proposal, And Reference Docs

- `platform/backend/docs/runbooks/local-bootstrap.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`
- `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- `platform/backend/docs/proposals/kms-signing.md`
- `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`
- `platform/backend/docs/proposals/api-gateway-proxy-routing.md`
- `platform/backend/docs/proposals/events-mails-cleanup.md`
- `platform/backend/docs/proposals/schema-drift-checks.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`
- `platform/backend/docs/archive/README.md`
- `platform/backend/docs/archive/postgres-archive/README.md`

## Migrated Admin Source Docs

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

## Migrated Collection Table Source Docs

- `platform/backend/docs/contracts/collection-table.md`

## Migrated Platform Studio Source Docs

- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

## Local Backend Docs

- `maestro/memory/docs/backend/doc-map.md`
- `maestro/memory/docs/backend/drift-report.md`
- `maestro/memory/docs/backend/contracts/doc-compaction-policy.md`
- `maestro/memory/docs/backend/archive/archive-candidates.md`

## Active Compact Backend Packs

- `maestro/memory/modules/backend/runtime/`
- `maestro/memory/modules/backend/auth-gateway/`
- `maestro/memory/modules/backend/migrations/`
- `maestro/memory/modules/backend/admin-modules/`
- `maestro/memory/modules/backend/platform-studio-form-builder/`

## Source Docs

Use tracked source docs for deep detail after reading compact memory:

- `platform/backend/AGENTS.md`
- `platform/backend/docs/README.md`
- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/contracts/events-identity.md`
- `platform/backend/docs/modules/runtime.md`
- `platform/backend/docs/runbooks/local-bootstrap.md`
- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`
- `platform/backend/docs/proposals/kms-signing.md`
- `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`
- `platform/backend/docs/proposals/api-gateway-proxy-routing.md`
- `platform/backend/docs/proposals/events-mails-cleanup.md`
- `platform/backend/docs/proposals/schema-drift-checks.md`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`
- `platform/backend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

Compatibility pointer docs for migrated runtime/auth/schema/admin slices should not be used as first-read docs.
Legacy MSSQL raw schema files are reference-code material only; read `docs/ref/reference-code.md` and alias `reference-pack:mssql-legacy-schema` before opening them.
Legacy PostgreSQL SQL under `platform/backend/docs/archive/postgres-archive/**` is archive/reference material only.

## Archive Rule

Do not promote old standards, prompt artifacts, proposed gateway/KMS/schema-drift plans, completed refactor plans, or legacy PostgreSQL SQL into active memory unless their durable outcome has not yet been captured elsewhere.
