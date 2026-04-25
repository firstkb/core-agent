# Backend Docs Map

Status: local source-doc map
Last audited: 2026-04-25

This map classifies `platform/backend/docs` for AI retrieval.
It does not replace tracked docs or code.

## Read Order

1. Read the relevant compact module memory in `ai-memory/modules/domains/` or `ai-memory/modules/backend/`.
2. Read only the exact tracked backend source doc listed for the task.
3. Verify behavior against code before changing runtime behavior.

Do not read the full backend docs corpus by default.

## Hot Runtime Contracts

Current contract-first docs:

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/runtime-wiring.md` | active contract | Runtime composition, module wiring, route registration, responsibility split | Primary runtime wiring source. |
| `platform/backend/docs/contracts/collection-table.md` | active contract | Shared Collection Table DTOs, validators, preferences, and current admin collection endpoint families | Primary backend collection-table source. |
| `platform/backend/docs/contracts/events-identity.md` | active contract | Event actor identity fields for master and tenant events | Primary event actor identity source. |
| `platform/backend/docs/contracts/platform-studio-form-builder.md` | active contract | Form Builder backend authoring API, metadata storage, runtime apply, generated objects, validation, migration boundary | Primary backend Form Builder source. |
| `platform/backend/docs/modules/runtime.md` | active module doc | Current runtime shape, active entrypoints, module roots, foundation boundaries | Primary backend runtime shape source. |
| `platform/backend/docs/modules/platform-studio/form-builder.md` | active module doc | Backend Form Builder implementation map, read order, code surfaces, and package guardrails | Primary backend Form Builder implementation orientation. |

Compatibility pointers:

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/AGENTS.md` | workspace guidance with drift | Backend package boundaries, route conventions, migration ownership, security rules | Current root `AGENTS.md` and local `ai-memory` win for AI-memory read order. |
| `platform/backend/docs/README.md` | active index | Tracked backend docs orientation | Use as a tracked table of contents; old root paths listed there are compatibility pointers only. |
| `platform/backend/docs/backend-current-to-target-map.md` | compatibility pointer | Old path for runtime target map | Read `modules/runtime.md` instead. |
| `platform/backend/docs/backend-module-wiring-standard.md` | compatibility pointer | Old path for module wiring standard | Read `contracts/runtime-wiring.md` instead. |
| `platform/backend/docs/backend-internal-foundation-matrix.md` | compatibility pointer | Old path for foundation matrix | Read `modules/runtime.md` instead. |
| `platform/backend/docs/local-backend-bootstrap.md` | compatibility pointer | Old path for local backend bootstrap | Read `runbooks/local-bootstrap.md` instead. |

## Operational Runbooks

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/runbooks/local-bootstrap.md` | active runbook | Local DBs, migrations, env, keys, seed flow | Primary local backend bootstrap runbook. |
| `platform/backend/docs/runbooks/auth-key-sources.md` | active runbook | File and Secrets Manager key sources, config/env shape | KMS config shape exists but KMS signing is not active. |
| `platform/backend/docs/runbooks/db-instance-secret-resolution.md` | active runbook | Tenant DB secret resolution and restart-required rotation behavior | Operational lookup and rotation guidance. |

## Auth And Gateway

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/auth-gateway.md` | active contract | Self-issued JWT, JWKS, refresh cookie, API Gateway authorizer target, trusted headers | Hot auth gateway contract. |
| `platform/backend/docs/contracts/auth-control-schema.md` | active contract | Master auth/control tables, refresh token family/session fields, tenant user auth fields | Hot auth schema contract. |
| `platform/backend/docs/modules/auth.md` | active module doc | Host-to-tenant resolution, no master user mirror for auth, direct tenant user read, OTP, refresh/logout | Hot auth module doc. |
| `platform/backend/docs/backend-auth-gateway-contract.md` | compatibility pointer | Old path for auth gateway contract | Read `contracts/auth-gateway.md` instead. |
| `platform/backend/docs/backend-auth-control-table-design.md` | compatibility pointer | Old path for auth control schema | Read `contracts/auth-control-schema.md` instead. |
| `platform/backend/docs/backend-auth-projection-and-sync.md` | compatibility pointer | Old path for auth boundary | Read `modules/auth.md` instead. |
| `platform/backend/docs/auth/auth-key-source-configuration.md` | compatibility pointer | Old path for auth key source configuration | Read `runbooks/auth-key-sources.md` instead. |
| `platform/backend/docs/auth/auth-kms-implementation-status.md` | compatibility pointer | Old path for future KMS signer work | Read `proposals/kms-signing.md` instead. |
| `platform/backend/docs/backend-auth-cookie-migration-plan.md` | archive pointer | Old path for historical cookie migration phases | Read `archive/backend-auth-cookie-migration-plan.md` only for history. |
| `platform/backend/docs/backend-api-gateway-http-api-mapping-spec.md` | compatibility pointer | Old path for future HTTP API mappings and JWT authorizer integration | Read `proposals/api-gateway-http-api-mapping.md` instead. |
| `platform/backend/docs/backend-api-gateway-proxy-routing-policy.md` | compatibility pointer | Old path for gateway proxy route grouping and path preservation | Read `proposals/api-gateway-proxy-routing.md` instead. |

Future proposal docs:

- `platform/backend/docs/proposals/kms-signing.md`
- `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`
- `platform/backend/docs/proposals/api-gateway-proxy-routing.md`
- `platform/backend/docs/proposals/events-mails-cleanup.md`
- `platform/backend/docs/proposals/schema-drift-checks.md`

## Admin Control Plane

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/admin-control-plane.md` | active contract | Admin profile/navigation boundaries, section grants, route-binding policy, root/non-root behavior | Primary admin access/control-plane source. |
| `platform/backend/docs/contracts/admin-module-registry.md` | active contract | Root-only Module Registry, module/section records, grants, list surface, registry routes | Primary Module Registry source. |
| `platform/backend/docs/backend-admin-module-registry-brief.md` | compatibility pointer | Old path for Module Registry brief | Read `contracts/admin-module-registry.md` instead. |
| `platform/backend/docs/backend-admin-access-policy-layering.md` | compatibility pointer | Old path for admin access policy layering | Read `contracts/admin-control-plane.md` instead. |
| `platform/backend/docs/backend-admin-tenant-events-mails-overlap-audit-v1.md` | compatibility pointer | Old path for events/mail overlap cleanup | Read `proposals/events-mails-cleanup.md` instead. |
| `platform/backend/docs/backend-admin-module-registry-refactor-plan.md` | archive pointer | Old path for historical Module Registry refactor steps | Read `archive/backend-admin-module-registry-refactor-plan.md` only for history. |

## Collection Table

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/collection-table.md` | active contract | Backend shared Collection Table DTOs, query validation, preferences, endpoint families, current admin consumers | Read with frontend `platform/frontend/docs/contracts/collection-table.md` for cross-stack work. |

## Platform Studio Form Builder

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/platform-studio-form-builder.md` | active contract | Backend Form Builder API, `ps_model`/`ps_view`, runtime metadata, additive runtime apply, generated runtime objects, validation, migration limits | Read with frontend `platform/frontend/docs/modules/platform-studio/form-builder.md` for cross-stack Form Builder work. |
| `platform/backend/docs/modules/platform-studio/form-builder.md` | active module doc | Backend implementation read order, route/wiring/module/schema surfaces, code map, and package split guardrails | Read before code changes in `platformstudioformbuilder`. |

Frontend compatibility pointers:

- `platform/frontend/docs/platform-studio/form-builder-backend*.md`
- `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md`

## Schema And Tenancy

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/schema-tenancy.md` | active contract | Master/tenant placement, canonical schema, tenant isolation, naming, import boundary | Primary schema/tenancy source. |
| `platform/backend/docs/contracts/migrations.md` | active contract | Master migrations, tenant migrations, bundle rules, `cmd/migrate` ownership | Primary migration source. |
| `platform/backend/docs/backend-schema-master-baseline.md` | compatibility pointer | Old path for master schema baseline | Read `contracts/schema-tenancy.md` instead. |
| `platform/backend/docs/backend-schema-tenant-baseline.md` | compatibility pointer | Old path for tenant schema baseline | Read `contracts/schema-tenancy.md` instead. |
| `platform/backend/docs/backend-schema-migrations-baseline.md` | compatibility pointer | Old path for migration baseline | Read `contracts/migrations.md` instead. |
| `platform/backend/docs/backend-schema-placement-and-naming.md` | compatibility pointer | Old path for placement/naming rules | Read `contracts/schema-tenancy.md` instead. |
| `platform/backend/docs/backend-db-instance-secret-resolution.md` | compatibility pointer | Old path for tenant DB secret resolution and operational lookup | Read `runbooks/db-instance-secret-resolution.md` instead. |
| `platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md` | compatibility pointer | Old path for tenant canonical refactor contract | Read `contracts/schema-tenancy.md` instead. |
| `platform/backend/docs/backend-tenant-canonical-field-mapping-v1.md` | compatibility pointer | Old path for legacy MSSQL to canonical tenant PostgreSQL field mapping | Read `reference/import-field-mapping.md` instead. |
| `platform/backend/docs/backend-tenant-import-module-boundary-v1.md` | compatibility pointer | Old path for runtime repo vs future import module boundary | Read `reference/tenant-import-boundary.md` instead. |
| `platform/backend/docs/backend-events-identity-contract.md` | compatibility pointer | Old path for event actor identity fields and attribution | Read `contracts/events-identity.md` instead. |
| `platform/backend/docs/backend-schema-drift-check-strategy.md` | compatibility pointer | Old path for future database drift verification | Read `proposals/schema-drift-checks.md` instead. |
| `platform/backend/docs/backend-tenant-starter-field-targets.md` | archive pointer | Old path for historical starter field target | Read `archive/backend-tenant-starter-field-targets.md` only for history. |

Import/reference docs:

- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`

## Historical And Reference Docs

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/MSSQL/**` | `reference_only` | Legacy MSSQL schema archaeology and import mapping support | Use `reference-pack:mssql-legacy-schema`; not active backend schema truth. |
| `platform/backend/docs/GO_AGENT_RULES.md` | archive pointer | Old path for historical Go/backend agent expectations | Current root/backend `AGENTS.md` and compact memory win. |
| `platform/backend/docs/ramp_v_108_backend_standard_v_2.md` | archive pointer | Old path for historical backend/platform standard | Do not read by default; current contracts win. |
| `platform/backend/docs/backend-export-architecture-agent-prompt.md` | archive pointer | Old path for prompt archaeology | Not a product/runtime source of truth. |
| `platform/backend/docs/archive/**` | archive | Historical backend plans, prompts, older standards, and archived SQL reference material | Opt-in only. |
| `platform/backend/docs/archive/postgres-archive/README.md` | archive index | Legacy PostgreSQL SQL inventory and read rules | Read only for explicit PostgreSQL archaeology tasks. |
| `platform/backend/docs/legacy/postgres-archive/README.md` | archive pointer | Old path for legacy PostgreSQL SQL archive | Read `archive/postgres-archive/README.md` instead. |
| `platform/backend/docs/legacy/**` | archive pointer | Old legacy docs path | Do not read by default. |

Tracked reference-code alias registry:

- `docs/ref/reference-code.md`

## Active Compact Packs

- Auth/session: `ai-memory/modules/domains/auth-and-session/`
- Schema/tenancy: `ai-memory/modules/domains/schema-and-tenancy/`
- Admin control plane: `ai-memory/modules/domains/admin-control-plane/`
- Admin module registry: `ai-memory/modules/domains/admin-module-registry/`
- Collection Table: `ai-memory/modules/domains/collection-table/`
- Backend runtime: `ai-memory/modules/backend/runtime/`
- Backend auth gateway: `ai-memory/modules/backend/auth-gateway/`
- Backend migrations: `ai-memory/modules/backend/migrations/`
- Backend admin modules: `ai-memory/modules/backend/admin-modules/`
- Platform Studio backend/Form Builder: `ai-memory/modules/backend/platform-studio-form-builder/`
