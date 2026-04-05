# Frontend Docs

Status: active

This folder holds frontend-local contracts and working design/implementation docs.
The shared durable memory layer lives in `platform/docs/ai/*`.

## Start here

Read in this order for most frontend work:

1. `platform/docs/ai/current-state.md`
2. `platform/docs/ai/canonical-docs.md`
3. `platform/docs/ai/platform-contract.md`
4. the relevant module memory file under `platform/docs/ai/modules/`
5. this file

## Canonical frontend docs by domain

### Workspace and app/package boundaries

- `app-surfaces.md`
- `package-boundaries.md`
- `tenant-model.md`

Supporting docs:

- `install-helper-runtime.md`
- `offline-strategy.md`
- `deferred-composed-surfaces.md`

### Auth and runtime integration

- `auth-agent-integration-brief.md`
- backend companion: `platform/backend/docs/backend-auth-gateway-contract.md`

Working auth backlog:

- `auth-runtime-followups.md`

### Collection-table runtime and shared-package path

- `collection-table-runtime-contract.md`
- `package-boundaries.md`

Supporting docs:

- `collection-table-shared-readiness-plan.md`
- `collection-table-backend-integration-contract.md`

### Admin module-registry proving surface

- `collection-table-backend-integration-contract.md`
- backend companion: `platform/backend/docs/backend-admin-module-registry-brief.md`

Supporting integration docs:

- `admin-module-registry-backend-handoff.md`
- `collection-table-runtime-contract.md`

### Visual foundation and UI contracts

- `ui-delivery-order.md`
- `layout-baseline.md`
- `ui-kit-boundary-audit.md`
- `ui-kit-stable-approved-audit.md`

Supporting docs:

- `ui-lab-structure.md`
- `ui-lab-ui-kit-coverage.md`

Working / historical docs:

- `foundation-rollout-plan.md`
- `phase-e-gap-review.md`

### Platform Builder V2

Current active builder direction:

- `platform-builder-v2/README.md`
- `platform-builder-v2/v2-foundation-brief.md`
- `platform-builder-v2/forms-foundation-a-technical-map.md`
- `platform-builder-v2/data-schema-storage-rules.md`
- `platform-builder-v2/ui-builder-backend-boundary.md`
- `platform-builder-v2/form-builder-field-catalog.md`

Supporting builder docs:

- `platform-builder-v2/ezform-analysis.md`
- `platform-builder-v2/ezform/**`

Historical or archive-only builder docs:

- `platform-builder-v2/agent-prompts.md`
- `platform-builder-v2/promt-continue.md`
- `platform-builder-v2/promt-continue-short.md`
- `platform/docs/archive/agent-prompts/platform-builder-v2-agent-prompts.md`
- `platform/docs/archive/agent-prompts/platform-builder-v2-continue.md`
- `platform/docs/archive/agent-prompts/platform-builder-v2-continue-short.md`
- `platform-builder-v2/old-code-reference/**`
- `vendor/**`
