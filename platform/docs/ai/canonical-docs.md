# Canonical Docs by Domain

Status: active
Date: 2026-04-05

This file answers one question quickly: which markdown files are authoritative for a given domain, and which files are only supporting, working, historical, or operational scaffolding.

Use it together with:

- `platform/AGENTS.md`
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/module-index.md`
- the relevant local `platform/backend/AGENTS.md` or `platform/frontend/AGENTS.md`

## How to read this file

- **Canonical** = default durable source of truth for the domain.
- **Supporting** = useful implementation detail, but not the first contract to read.
- **Working / historical** = plans, audits, handoffs, old standards, or archive material; read only when the task needs them.
- **Operational scaffolds** = prompts, templates, skills, manifests, changelogs, scripts, and run artifacts that structure work, but are not project truth.

## Shared platform

### Canonical durable memory

- `platform/AGENTS.md`
- `platform/docs/ai/README.md`
- `platform/docs/ai/platform-contract.md`
- `platform/docs/ai/current-state.md`
- `platform/docs/ai/decisions-log.md`
- `platform/docs/ai/repo-map.md`
- `platform/docs/ai/module-index.md`
- `platform/docs/ai/canonical-docs.md`
- `platform/docs/ai/modules/*`
- `platform/docs/ai/markdown-governance.md`
- `platform/backend/AGENTS.md`
- `platform/frontend/AGENTS.md`

### Supporting

- `platform/README.md`
- `platform/backend/docs/README.md`
- `platform/frontend/docs/README.md`
- `platform/docs/ai/orchestration-boundaries.md`

### Operational scaffolds (not durable memory)

- `.agents/skills/ramp-conductor/SKILL.md`
- `.agents/skills/ramp-conductor/agents/openai.yaml`
- `platform/docs/ai/automation-manifest.json`
- `platform/docs/ai/automation-changelog.md`
- `platform/docs/ai/prompts/README.md`
- `platform/docs/ai/prompts/control-chat-prompt-v1.md`
- `platform/docs/ai/prompts/frontend-prompt-v1.md`
- `platform/docs/ai/prompts/frontend-prompt-compact-v1.md`
- `platform/docs/ai/prompts/backend-prompt-v1.md`
- `platform/docs/ai/prompts/backend-prompt-compact-v1.md`
- `platform/docs/ai/templates/README.md`
- `platform/docs/ai/templates/*`
- `platform/docs/ai/runs/README.md`
- `platform/docs/ai/runs/*`
- `scripts/ai/new-run.py`
- `scripts/ai/new-run.sh`

### Working / historical

- `platform/docs/archive/**`
- product prompt artifacts and old migration/legacy folders
- closed run artifacts

## Backend domains

### Backend workspace and runtime shape

#### Canonical

- `platform/backend/README.md`
- `platform/backend/docs/backend-current-to-target-map.md`
- `platform/backend/docs/backend-module-wiring-standard.md`
- `platform/backend/docs/backend-internal-foundation-matrix.md`
- `platform/backend/docs/local-backend-bootstrap.md`

#### Supporting

- `platform/backend/docs/backend-api-gateway-http-api-mapping-spec.md`
- `platform/backend/docs/backend-api-gateway-proxy-routing-policy.md`
- `platform/backend/docs/backend-events-identity-contract.md`

#### Working / historical

- `platform/backend/docs/GO_AGENT_RULES.md`
- `platform/backend/docs/ramp_v_108_backend_standard_v_2.md`
- `platform/backend/docs/backend-export-architecture-agent-prompt.md`

### Backend auth and session

#### Canonical

- `platform/backend/docs/backend-auth-gateway-contract.md`
- `platform/backend/docs/backend-auth-control-table-design.md`
- `platform/backend/docs/backend-auth-projection-and-sync.md`
- `platform/backend/docs/auth/auth-key-source-configuration.md`

#### Supporting

- `platform/backend/docs/backend-db-instance-secret-resolution.md`
- `platform/backend/docs/auth/auth-kms-implementation-status.md`

#### Working / historical

- `platform/backend/docs/backend-auth-cookie-migration-plan.md`

### Backend admin control plane

#### Canonical

- `platform/backend/docs/backend-admin-module-registry-brief.md`
- `platform/backend/docs/backend-admin-access-policy-layering.md`

#### Supporting

- `platform/backend/docs/backend-api-gateway-http-api-mapping-spec.md`
- `platform/backend/docs/backend-api-gateway-proxy-routing-policy.md`

#### Working / historical

- `platform/backend/docs/backend-admin-module-registry-refactor-plan.md`

### Backend schema and tenancy

#### Canonical

- `platform/backend/docs/backend-schema-master-baseline.md`
- `platform/backend/docs/backend-schema-tenant-baseline.md`
- `platform/backend/docs/backend-schema-migrations-baseline.md`
- `platform/backend/docs/backend-schema-placement-and-naming.md`
- `platform/backend/docs/backend-tenant-starter-field-targets.md`

#### Supporting

- `platform/backend/docs/backend-schema-drift-check-strategy.md`
- `platform/backend/docs/backend-db-instance-secret-resolution.md`

#### Working / historical

- `platform/backend/docs/legacy/**`
- `platform/backend/migrations/postgres/archive/**`

## Frontend domains

### Frontend workspace and app/package boundaries

#### Canonical

- `platform/frontend/README.md`
- `platform/frontend/docs/app-surfaces.md`
- `platform/frontend/docs/package-boundaries.md`
- `platform/frontend/docs/tenant-model.md`

#### Supporting

- `platform/frontend/docs/deferred-composed-surfaces.md`
- `platform/frontend/docs/install-helper-runtime.md`
- `platform/frontend/docs/offline-strategy.md`

### Frontend auth and runtime bootstrap

#### Canonical

- `platform/frontend/docs/auth-agent-integration-brief.md`
- `platform/backend/docs/backend-auth-gateway-contract.md`

#### Supporting

- `platform/frontend/docs/install-helper-runtime.md`

#### Working / historical

- `platform/frontend/docs/auth-runtime-followups.md`

### Frontend collection-table runtime and shared-package path

#### Canonical

- `platform/frontend/docs/collection-table-runtime-contract.md`
- `platform/frontend/docs/package-boundaries.md`

#### Supporting

- `platform/frontend/docs/collection-table-shared-readiness-plan.md`
- `platform/frontend/docs/collection-table-backend-integration-contract.md`

### Frontend admin module-registry proving surface

#### Canonical

- `platform/frontend/docs/collection-table-backend-integration-contract.md`
- `platform/backend/docs/backend-admin-module-registry-brief.md`

#### Supporting

- `platform/frontend/docs/admin-module-registry-backend-handoff.md`
- `platform/frontend/docs/collection-table-runtime-contract.md`

### Frontend visual foundation and UI contracts

#### Canonical

- `platform/frontend/docs/ui-delivery-order.md`
- `platform/frontend/docs/layout-baseline.md`
- `platform/frontend/docs/ui-kit-boundary-audit.md`
- `platform/frontend/docs/ui-kit-stable-approved-audit.md`

#### Supporting

- `platform/frontend/docs/ui-lab-structure.md`
- `platform/frontend/docs/ui-lab-ui-kit-coverage.md`

#### Working / historical

- `platform/frontend/docs/foundation-rollout-plan.md`
- `platform/frontend/docs/phase-e-gap-review.md`

### Platform Studio

#### Canonical

- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md`
- `platform/frontend/docs/platform-studio/v2-foundation-brief.md`
- `platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md`
- `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`
- `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-validation-matrix.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-object-generation-matrix.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-migration-policy.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-first-slice-handoff.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-technical-task-list.md`
- `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`
- `platform/frontend/docs/platform-studio/form-builder-section-tree.md`
- `platform/frontend/docs/platform-studio/form-builder-core-data-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-choice-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md`
- `platform/frontend/docs/platform-studio/form-builder-advanced-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-content-nodes.md`
- `platform/frontend/docs/platform-studio/form-builder-field-rules-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-grid-columns-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-ready-made-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-relationships.md`
- `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-subform-checklist-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-system-fields.md`
- `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-v2-field-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md`

#### Supporting

- `platform/frontend/docs/platform-studio/ezform-analysis.md`
- `platform/frontend/docs/platform-studio/form-builder-page-and-filter-notes.md`
- `platform/frontend/docs/platform-studio/ezform/**`

#### Working / historical

- `platform/frontend/docs/platform-studio/agent-prompts.md`
- `platform/frontend/docs/platform-studio/promt-continue.md`
- `platform/frontend/docs/platform-studio/promt-continue-short.md`
- `platform/docs/archive/agent-prompts/platform-studio-agent-prompts.md`
- `platform/docs/archive/agent-prompts/platform-studio-continue.md`
- `platform/docs/archive/agent-prompts/platform-studio-continue-short.md`
- `platform/frontend/docs/platform-studio/old-code-reference/**`
- `platform/frontend/docs/vendor/**`

## Fast domain picks

- Auth/session task -> backend auth canonical set + frontend auth canonical set
- Admin navigation / access-policy task -> backend admin control-plane canonical set
- Admin module registry task -> backend admin control-plane canonical set + frontend admin module-registry proving-surface canonical set
- Collection-table runtime / shared-package task -> frontend collection-table canonical set + frontend workspace/app-package canonical set
- Migration / tenancy task -> backend schema and tenancy canonical set
- Shared package / app-boundary task -> frontend workspace and app/package canonical set
- Builder task -> Platform Studio canonical set
