# Canonical Docs Registry

Status: compact active registry
Last compacted: 2026-04-25

This file lists current owner surfaces.
Use it to avoid reading the full docs corpus.

## Repository Runtime

Canonical:

- `AGENTS.md`
- `README.md`
- `docs/README.md`
- `docs/codex-native-repo.md`
- `docs/maestro/module-orchestrator-v2-spec-pack/`
- `.agents/skills/maestro/SKILL.md`
- `.agents/skills/charlie/SKILL.md`
- `.agents/skills/grant/SKILL.md`
- `.codex/contracts/**`
- `.codex/templates/**`
- `.codex/standards/**`
- `.agent-cli/config.json`

Future-target only:

- `docs/maestro/maestro-feature-formation-canonical.md`

Reference:

- `docs/ref/README.md`
- `docs/ref/reference-code.md`

Historical archive:

- `docs/archive/README.md`
- `docs/archive/memory-reorg/README.md`

Local reference-code policy:

- `ai-memory/durable/reference-code-policy.md`
- `ai-memory/reference-code/README.md`
- `ai-memory/reference-code/packs-index.md`
- `ai-memory/reference-code/relocation-plan.md`

## Product Shared Memory

Local compact owner surfaces:

- `ai-memory/agent-workflow.md`
- `ai-memory/durable/current-state.md`
- `ai-memory/durable/platform-contract.md`
- `ai-memory/durable/module-index.md`
- `ai-memory/durable/decisions-log.md`
- `ai-memory/durable/repo-map.md`
- `ai-memory/durable/canonical-docs.md`
- `ai-memory/modules/domains/**`
- `ai-memory/modules/frontend/**`
- `ai-memory/modules/backend/**`

Historical import/audit surface:

- `ai-memory/durable/legacy-memory-import.md`

Old `platform/docs/ai/**` memory is historical import material only.
It is not the active canonical owner surface after the local memory rewrite.

Local docs rewrite planning surface:

- `ai-memory/docs/README.md`
- `ai-memory/docs/target-docs-structure.md`
- `ai-memory/docs/docs-migration-plan.md`

Operational scaffolds, not product truth:

- `ai-memory/atlas/prompts/**`
- `ai-memory/atlas/templates/**`
- `ai-memory/runs/active/**`
- `ai-memory/runs/archive/**`
- `ai-memory/atlas/automation-manifest.json`
- `ai-memory/atlas/automation-changelog.md`
- `ai-memory/atlas/migration-audit.md`
- `ai-memory/atlas/platform-docs-ai-retirement-plan.md`
- `.agents/skills/ramp-conductor/**`
- `scripts/ai/**`

Legacy operational provenance only:

- `platform/docs/ai/prompts/**`
- `platform/docs/ai/templates/**`
- `platform/docs/ai/runs/**`
- `platform/docs/ai/automation-manifest.json`
- `platform/docs/ai/automation-changelog.md`

## Backend

Local compact docs map:

- `ai-memory/docs/backend/README.md`
- `ai-memory/docs/backend/doc-map.md`
- `ai-memory/docs/backend/drift-report.md`
- `ai-memory/docs/backend/contracts/doc-compaction-policy.md`
- `ai-memory/docs/backend/archive/archive-candidates.md`

Workspace/runtime:

- `platform/backend/AGENTS.md`
- `platform/backend/README.md`
- `platform/backend/docs/README.md`
- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/contracts/events-identity.md`
- `platform/backend/docs/modules/runtime.md`
- `platform/backend/docs/runbooks/local-bootstrap.md`

Auth:

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`
- `platform/backend/docs/proposals/kms-signing.md`

Admin:

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

Gateway proposals:

- `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`
- `platform/backend/docs/proposals/api-gateway-proxy-routing.md`
- `platform/backend/docs/proposals/events-mails-cleanup.md`

Schema/tenancy:

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- `platform/backend/docs/proposals/schema-drift-checks.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`

Backend archive:

- `platform/backend/docs/archive/README.md`
- `platform/backend/docs/archive/postgres-archive/README.md`

Platform Studio:

- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

## Frontend

Workspace/package boundaries:

- `ai-memory/docs/target-docs-structure.md`
- `ai-memory/docs/frontend/README.md`
- `ai-memory/docs/frontend/doc-map.md`
- `ai-memory/docs/frontend/drift-report.md`
- `ai-memory/docs/frontend/contracts/doc-compaction-policy.md`
- `platform/frontend/AGENTS.md`
- `platform/frontend/README.md`
- `platform/frontend/docs/README.md`
- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/contracts/app-surfaces.md`
- `platform/frontend/docs/contracts/package-boundaries.md`
- `platform/frontend/docs/contracts/tenant-model.md`
- `platform/frontend/docs/contracts/auth-runtime.md`
- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`
- `platform/frontend/docs/guides/install-helper.md`
- `platform/frontend/docs/guides/local-dev.md`
- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-admin-web.md`
- `platform/frontend/docs/modules/tenant-web.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/frontend/docs/proposals/pwa-offline.md`
- `platform/frontend/docs/proposals/deferred-composed-surfaces.md`

Auth:

- `platform/frontend/docs/contracts/auth-runtime.md`

Tenant Web:

- `ai-memory/modules/frontend/tenant-web/README.md`
- `platform/frontend/docs/modules/tenant-web.md`

Collection Table:

- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/collection-table.md`

UI:

- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`
- `platform/frontend/docs/guides/install-helper.md`
- `platform/frontend/docs/proposals/deferred-composed-surfaces.md`

Platform Studio:

- `ai-memory/modules/domains/platform-studio/README.md`
- `ai-memory/modules/domains/platform-studio/tools/README.md`
- `ai-memory/modules/backend/platform-studio-form-builder/README.md`
- `ai-memory/docs/frontend/platform-studio/README.md`
- `ai-memory/docs/frontend/platform-studio/doc-map.md`
- `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- `ai-memory/docs/frontend/platform-studio/contracts/doc-compaction-policy.md`
- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md`

Historical / opt-in:

- `platform/frontend/docs/vendor/**`
- `reference-code/**`
- old reference pointer READMEs under `platform/frontend/docs/metronic/`, `platform/frontend/docs/platform-studio/EXTDB/`, `platform/frontend/docs/platform-studio/ezform/`, `platform/frontend/docs/platform-studio/smartapp/`, `platform/frontend/docs/platform-studio/old-code-reference/`, and `platform/backend/docs/MSSQL/`
- `ai-memory/docs/frontend/archive/archive-candidates.md`
- `ai-memory/docs/backend/archive/archive-candidates.md`
- `platform/backend/docs/archive/postgres-archive/**`
- `platform/backend/docs/legacy/**`
- `platform/docs/archive/**`
