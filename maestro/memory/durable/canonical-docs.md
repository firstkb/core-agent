# Canonical Docs Registry

Status: compact active registry
Last compacted: 2026-04-29

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
- `.agents/skills/archivist/SKILL.md`
- `.codex/contracts/**`
- `.codex/templates/**`
- `.codex/standards/**`
- `.agent-cli/config.json`

Automation gates:

- `.github/workflows/docs-memory-check.yml`

Future-target only:

- `docs/maestro/maestro-feature-formation-canonical.md`

Reference:

- `docs/ref/README.md`
- `docs/ref/reference-code.md`

Historical archive:

- `docs/archive/README.md`
- `docs/archive/memory-reorg/README.md`

Local reference-code policy:

- `maestro/memory/durable/reference-code-policy.md`
- `maestro/memory/reference-code/README.md`
- `maestro/memory/reference-code/packs-index.md`
- `maestro/memory/reference-code/relocation-plan.md`

## Product Shared Memory

Local compact owner surfaces:

- `maestro/memory/agent-workflow.md`
- `maestro/memory/durable/current-state.md`
- `maestro/memory/durable/platform-contract.md`
- `maestro/memory/durable/module-index.md`
- `maestro/memory/durable/decisions-log.md`
- `maestro/memory/durable/repo-map.md`
- `maestro/memory/durable/canonical-docs.md`
- `maestro/memory/modules/domains/**`
- `maestro/memory/modules/frontend/**`
- `maestro/memory/modules/backend/**`

Historical import/audit surface:

- `maestro/memory/durable/legacy-memory-import.md`

The former `platform/docs/ai/**` memory layer is historical import material
only and has been deleted after migration. It is not an active canonical owner
surface; use `maestro/memory/durable/legacy-memory-import.md` and git history for
provenance.

Local docs rewrite planning surface:

- `maestro/memory/START_HERE.md`
- `maestro/memory/docs/README.md`
- `maestro/memory/docs/target-docs-structure.md`
- `maestro/memory/docs/docs-migration-plan.md`
- `maestro/memory/docs/docs-memory-score-audit.md`

Operational scaffolds, not product truth:

- `maestro/artifact/**`
- `maestro/templates/**`
- `.agents/skills/archivist/**`
- `scripts/ai/**`
- `.github/workflows/docs-memory-check.yml`

Archived operational scaffolds:

- `maestro/archive/final-atlas/**`

Former legacy sources, deleted from the working tree:

- `platform/docs/ai/*.md`
- `platform/docs/ai/modules/*.md`
- `platform/docs/ai/prompts/**`
- `platform/docs/ai/templates/**`
- `platform/docs/ai/runs/**`
- `platform/docs/ai/automation-manifest.json`

## Backend

Local compact docs map:

- `maestro/memory/docs/backend/README.md`
- `maestro/memory/docs/backend/doc-map.md`
- `maestro/memory/docs/backend/drift-report.md`
- `maestro/memory/docs/backend/contracts/doc-compaction-policy.md`
- `maestro/memory/docs/backend/archive/archive-candidates.md`

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

- `maestro/memory/docs/target-docs-structure.md`
- `maestro/memory/docs/frontend/README.md`
- `maestro/memory/docs/frontend/doc-map.md`
- `maestro/memory/docs/frontend/drift-report.md`
- `maestro/memory/docs/frontend/contracts/doc-compaction-policy.md`
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

- `maestro/memory/modules/frontend/tenant-web/README.md`
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

- `maestro/memory/modules/domains/platform-studio/README.md`
- `maestro/memory/modules/domains/platform-studio/tools/README.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
- `maestro/memory/modules/backend/platform-studio-form-builder/README.md`
- `maestro/memory/docs/frontend/platform-studio/README.md`
- `maestro/memory/docs/frontend/platform-studio/doc-map.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-replacement-roadmap.md`
- `maestro/memory/docs/frontend/platform-studio/contracts/doc-compaction-policy.md`
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
- `maestro/memory/docs/frontend/archive/archive-candidates.md`
- `maestro/memory/docs/backend/archive/archive-candidates.md`
- `platform/backend/docs/archive/postgres-archive/**`
- `platform/backend/docs/legacy/**`
- `platform/docs/archive/**`
