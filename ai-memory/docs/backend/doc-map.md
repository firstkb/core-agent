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
| `platform/backend/docs/contracts/platform-studio-form-builder.md` | active contract | Form Builder backend authoring API, metadata storage, runtime apply, generated objects, validation, migration boundary | Primary backend Form Builder source. |
| `platform/backend/docs/modules/runtime.md` | active module doc | Current runtime shape, active entrypoints, module roots, foundation boundaries | Primary backend runtime shape source. |
| `platform/backend/docs/modules/platform-studio/form-builder.md` | active module doc | Backend Form Builder implementation map, read order, code surfaces, and package guardrails | Primary backend Form Builder implementation orientation. |

Compatibility pointers:

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/AGENTS.md` | workspace guidance with drift | Backend package boundaries, route conventions, migration ownership, security rules | Current root `AGENTS.md` and local `ai-memory` win for AI-memory read order. |
| `platform/backend/docs/README.md` | active index | Tracked backend docs orientation | Use as a tracked table of contents, not as complete context. |
| `platform/backend/docs/backend-current-to-target-map.md` | compatibility pointer | Old path for runtime target map | Read `modules/runtime.md` instead. |
| `platform/backend/docs/backend-module-wiring-standard.md` | compatibility pointer | Old path for module wiring standard | Read `contracts/runtime-wiring.md` instead. |
| `platform/backend/docs/backend-internal-foundation-matrix.md` | compatibility pointer | Old path for foundation matrix | Read `modules/runtime.md` instead. |
| `platform/backend/docs/local-backend-bootstrap.md` | active local runbook | Local DBs, migrations, env, keys, seed flow | Operational runbook; some seed/auth wording needs verification. |

## Auth And Gateway

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/auth-gateway.md` | active contract | Self-issued JWT, JWKS, refresh cookie, API Gateway authorizer target, trusted headers | Hot auth gateway contract. |
| `platform/backend/docs/contracts/auth-control-schema.md` | active contract | Master auth/control tables, refresh token family/session fields, tenant user auth fields | Hot auth schema contract. |
| `platform/backend/docs/modules/auth.md` | active module doc | Host-to-tenant resolution, no master user mirror for auth, direct tenant user read, OTP, refresh/logout | Hot auth module doc. |
| `platform/backend/docs/backend-auth-gateway-contract.md` | compatibility pointer | Old path for auth gateway contract | Read `contracts/auth-gateway.md` instead. |
| `platform/backend/docs/backend-auth-control-table-design.md` | compatibility pointer | Old path for auth control schema | Read `contracts/auth-control-schema.md` instead. |
| `platform/backend/docs/backend-auth-projection-and-sync.md` | compatibility pointer | Old path for auth boundary | Read `modules/auth.md` instead. |
| `platform/backend/docs/auth/auth-key-source-configuration.md` | active implementation note | File and Secrets Manager key sources, config/env shape | KMS config shape exists but KMS signing is not active. |
| `platform/backend/docs/auth/auth-kms-implementation-status.md` | planned | Future KMS signer work | Read only for KMS tasks. |
| `platform/backend/docs/backend-auth-cookie-migration-plan.md` | working migration plan | Historical cookie migration phases | Prefer compact auth memory and code for current behavior. |
| `platform/backend/docs/backend-api-gateway-http-api-mapping-spec.md` | proposed implementation spec | Future HTTP API mappings and JWT authorizer integration | Proposed/supporting, not live runtime contract by itself. |
| `platform/backend/docs/backend-api-gateway-proxy-routing-policy.md` | proposed working policy | Proxy route grouping and path preservation | Proposed/supporting, not live runtime contract by itself. |

## Admin Control Plane

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/admin-control-plane.md` | active contract | Admin profile/navigation boundaries, section grants, route-binding policy, root/non-root behavior | Primary admin access/control-plane source. |
| `platform/backend/docs/contracts/admin-module-registry.md` | active contract | Root-only Module Registry, module/section records, grants, list surface, registry routes | Primary Module Registry source. |
| `platform/backend/docs/backend-admin-module-registry-brief.md` | compatibility pointer | Old path for Module Registry brief | Read `contracts/admin-module-registry.md` instead. |
| `platform/backend/docs/backend-admin-access-policy-layering.md` | compatibility pointer | Old path for admin access policy layering | Read `contracts/admin-control-plane.md` instead. |
| `platform/backend/docs/backend-admin-tenant-events-mails-overlap-audit-v1.md` | current audit | Event/mail overlap between master and tenant DBs | Supporting audit for events/mail cleanup. |
| `platform/backend/docs/backend-admin-module-registry-refactor-plan.md` | completed plan | Historical Module Registry refactor steps | Archive candidate after durable outcomes are captured. |

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
| `platform/backend/docs/backend-db-instance-secret-resolution.md` | active v1 | Tenant DB secret resolution and operational lookup | Read for provisioning/DB secret tasks. |
| `platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md` | compatibility pointer | Old path for tenant canonical refactor contract | Read `contracts/schema-tenancy.md` instead. |
| `platform/backend/docs/backend-tenant-canonical-field-mapping-v1.md` | accepted mapping | Legacy MSSQL to canonical tenant PostgreSQL field mapping | Supporting import/reference contract. |
| `platform/backend/docs/backend-tenant-import-module-boundary-v1.md` | accepted boundary | Runtime repo vs future import module boundary | Supporting boundary contract. |
| `platform/backend/docs/backend-events-identity-contract.md` | accepted contract | Event actor identity fields and event attribution | Read for events audit/logging tasks. |
| `platform/backend/docs/backend-schema-drift-check-strategy.md` | backlog strategy | Future database drift verification | Verification strategy only, not schema source of truth. |
| `platform/backend/docs/backend-tenant-starter-field-targets.md` | superseded | Historical starter field target | Archive candidate. |

## Historical And Reference Docs

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/MSSQL/**` | `reference_only` | Legacy MSSQL schema archaeology and import mapping support | Use `reference-pack:mssql-legacy-schema`; not active backend schema truth. |
| `platform/backend/docs/GO_AGENT_RULES.md` | older agent rules | Historical Go/backend agent expectations | Current root/backend `AGENTS.md` and compact memory win. |
| `platform/backend/docs/ramp_v_108_backend_standard_v_2.md` | historical large standard | Legacy design background only | Do not read by default; distill facts into compact memory if still valid. |
| `platform/backend/docs/backend-export-architecture-agent-prompt.md` | archived prompt reference | Prompt archaeology only | Not a product/runtime source of truth. |
| `platform/backend/docs/legacy/**` | archive/reference | PostgreSQL archive material | Opt-in only. |

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
