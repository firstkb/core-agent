# Backend Docs Index

Status: active

Use this index together with `platform/docs/ai/*`.
This folder holds backend-local contracts, runbooks, and working implementation docs.

## Start here

Read in this order for most backend work:

1. `platform/docs/ai/current-state.md`
2. `platform/docs/ai/canonical-docs.md`
3. `platform/docs/ai/platform-contract.md`
4. the relevant module memory file under `platform/docs/ai/modules/`
5. this file

## Canonical backend docs by domain

### Workspace and runtime shape

- `backend-current-to-target-map.md`
- `backend-module-wiring-standard.md`
- `backend-internal-foundation-matrix.md`
- `local-backend-bootstrap.md`

### Auth and session

- `backend-auth-gateway-contract.md`
- `backend-auth-control-table-design.md`
- `backend-auth-projection-and-sync.md`
- `auth/auth-key-source-configuration.md`

Supporting auth docs:

- `backend-db-instance-secret-resolution.md`
- `auth/auth-kms-implementation-status.md`

### Admin control plane

- `backend-admin-module-registry-brief.md`
- `backend-admin-access-policy-layering.md`

Supporting admin docs:

- `backend-api-gateway-http-api-mapping-spec.md`
- `backend-api-gateway-proxy-routing-policy.md`

Note:

- `backend-admin-module-registry-brief.md` is canonical for the module-registry control-plane domain
- it should not be treated as the owner of the generic collection-table runtime contract

### Schema and tenancy

- `backend-schema-master-baseline.md`
- `backend-schema-tenant-baseline.md`
- `backend-schema-migrations-baseline.md`
- `backend-schema-placement-and-naming.md`
- `backend-tenant-starter-field-targets.md`

Supporting schema docs:

- `backend-schema-drift-check-strategy.md`
- `backend-db-instance-secret-resolution.md`

## Working or historical docs

Read only when the task explicitly needs rationale or rollout history:

- `backend-admin-module-registry-refactor-plan.md`
- `backend-auth-cookie-migration-plan.md`
- `ramp_v_108_backend_standard_v_2.md`
- `GO_AGENT_RULES.md`
- `backend-export-architecture-agent-prompt.md`
- `legacy/**`

## Archive note

One-off prompt material lives under:

- `platform/docs/archive/agent-prompts/`
