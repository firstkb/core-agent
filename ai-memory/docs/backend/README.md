# Backend Memory Docs

Status: local compact index
Last audited: 2026-04-25

Use this folder to choose the smallest useful backend doc set.
Do not mirror the entire `platform/backend/docs` corpus here.

## Target Rewrite

- `ai-memory/docs/target-docs-structure.md`

## Migrated Runtime Source Docs

- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/modules/runtime.md`

## Migrated Auth Source Docs

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`

## Migrated Schema Source Docs

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`

## Migrated Admin Source Docs

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

## Migrated Collection Table Source Docs

- `platform/backend/docs/contracts/collection-table.md`

## Migrated Platform Studio Source Docs

- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

## Local Backend Docs

- `ai-memory/docs/backend/doc-map.md`
- `ai-memory/docs/backend/drift-report.md`
- `ai-memory/docs/backend/contracts/doc-compaction-policy.md`
- `ai-memory/docs/backend/archive/archive-candidates.md`

## Active Compact Backend Packs

- `ai-memory/modules/backend/runtime/`
- `ai-memory/modules/backend/auth-gateway/`
- `ai-memory/modules/backend/migrations/`
- `ai-memory/modules/backend/admin-modules/`
- `ai-memory/modules/backend/platform-studio-form-builder/`

## Source Docs

Use tracked source docs for deep detail after reading compact memory:

- `platform/backend/AGENTS.md`
- `platform/backend/docs/README.md`
- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/modules/runtime.md`
- `platform/backend/docs/local-backend-bootstrap.md`
- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/auth/auth-key-source-configuration.md`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

Compatibility pointer docs for migrated runtime/auth/schema/admin slices should not be used as first-read docs.
Legacy MSSQL raw schema files are reference-code material only; read `docs/ref/reference-code.md` and alias `reference-pack:mssql-legacy-schema` before opening them.

## Archive Rule

Do not promote old standards, prompt artifacts, proposed gateway plans, or completed refactor plans into active memory unless their durable outcome has not yet been captured elsewhere.
