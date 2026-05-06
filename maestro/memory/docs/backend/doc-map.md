# Backend Docs Map

Status: local source-doc map
Last audited: 2026-04-25

This map classifies `platform/backend/docs` for AI retrieval.
It does not replace tracked docs or code.

## Read Order

1. Read the relevant compact module memory in `maestro/memory/modules/domains/` or `maestro/memory/modules/backend/`.
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
| `platform/backend/docs/contracts/platform-studio-navigation-builder.md` | active contract | Navigation Builder backend authoring API, saved definition storage, validation, and runtime-sidebar handoff boundary | Primary backend Navigation Builder source. |
| `platform/backend/docs/modules/runtime.md` | active module doc | Current runtime shape, active entrypoints, module roots, foundation boundaries | Primary backend runtime shape source. |
| `platform/backend/docs/modules/platform-studio/form-builder.md` | active module doc | Backend Form Builder implementation map, read order, code surfaces, and package guardrails | Primary backend Form Builder implementation orientation. |
| `platform/backend/docs/modules/platform-studio/navigation-builder.md` | active module doc | Backend Navigation Builder implementation map, read order, code surfaces, and package guardrails | Primary backend Navigation Builder implementation orientation. |

Compatibility pointers:

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/AGENTS.md` | workspace guidance with drift | Backend package boundaries, route conventions, migration ownership, security rules | Current root `AGENTS.md` and local `maestro/memory` win for AI-memory read order. |
| `platform/backend/docs/README.md` | active index | Tracked backend docs orientation | Use as a tracked table of contents. |

Pointer-only runtime target map, foundation matrix, module wiring, and local
bootstrap root files were deleted after compaction.

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

Pointer-only auth gateway/control/projection/key-source/KMS/gateway root files
were deleted after compaction. The historical cookie migration payload was
removed from the working tree; recover exact old text from git history only.

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

Pointer-only admin Module Registry brief/access-policy/events-mails/refactor root
files were deleted after compaction.

## Collection Table

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/collection-table.md` | active contract | Backend shared Collection Table DTOs, query validation, preferences, endpoint families, current admin consumers | Read with frontend `platform/frontend/docs/contracts/collection-table.md` for cross-stack work. |

## Platform Studio Form Builder

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/platform-studio-form-builder.md` | active contract | Backend Form Builder API, `ps_model`/`ps_view`, runtime metadata, additive runtime apply, generated runtime objects, validation, migration limits | Read with frontend `platform/frontend/docs/modules/platform-studio/form-builder.md` for cross-stack Form Builder work. |
| `platform/backend/docs/modules/platform-studio/form-builder.md` | active module doc | Backend implementation read order, route/wiring/module/schema surfaces, code map, and package split guardrails | Read before code changes in `platformstudioformbuilder`. |

Old frontend-owned backend-facing Form Builder pointer files were deleted after
backend facts were compacted into the backend contract.

## Platform Studio Navigation Builder

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/platform-studio-navigation-builder.md` | active contract | Backend Navigation Builder API, `ps_navigation_config`, validation, duplicate target prevention, and runtime sidebar handoff | Read with frontend `platform/frontend/docs/contracts/platform-studio.md` for cross-stack Navigation Builder work. |
| `platform/backend/docs/modules/platform-studio/navigation-builder.md` | active module doc | Backend implementation read order, route/wiring/module/schema surfaces, code map, and package guardrails | Read before code changes in `platformstudionavigationbuilder`. |

## Schema And Tenancy

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `platform/backend/docs/contracts/schema-tenancy.md` | active contract | Master/tenant placement, canonical schema, tenant isolation, naming, import boundary | Primary schema/tenancy source. |
| `platform/backend/docs/contracts/migrations.md` | active contract | Master migrations, tenant migrations, bundle rules, `cmd/migrate` ownership | Primary migration source. |

Pointer-only schema baseline, migration baseline, placement/naming, tenant
canonical/refactor/import/reference/events/drift root files were deleted after
compaction.

Import/reference docs:

- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`

## Historical And Reference Docs

| Source | Status | Read for | Retrieval note |
| --- | --- | --- | --- |
| `reference-pack:mssql-legacy-schema` | `reference_only` | Legacy MSSQL schema archaeology and import mapping support | Raw pack is local-only under `reference-code/backend/mssql-legacy-schema/`; not active backend schema truth. |
| `platform/backend/**` | archive | Historical backend plans, prompts, older standards, and archived SQL reference material | Opt-in only. |
| `platform/backend/docs/archive/postgres-archive/README.md` | archive index | Legacy PostgreSQL SQL inventory and read rules | Read only for explicit PostgreSQL archaeology tasks. |
| `platform/backend/docs/legacy/postgres-archive/README.md` | archive pointer | Old path for legacy PostgreSQL SQL archive | Read `archive/postgres-archive/README.md` instead. |
| `platform/backend/docs/legacy/**` | archive pointer | Old legacy docs path | Do not read by default. |

Old root archive pointer files for Go rules, historical RAMP standard, export prompt,
auth cookie migration, Module Registry refactor, and tenant starter fields were
deleted after compaction. Use `platform/backend/**` or git history
for exact old text.

Tracked reference-code alias registry:

- `maestro/memory/reference-code/README.md`

## Active Compact Packs

- Auth/session: `maestro/memory/modules/domains/auth-and-session/`
- Schema/tenancy: `maestro/memory/modules/domains/schema-and-tenancy/`
- Admin control plane: `maestro/memory/modules/domains/admin-control-plane/`
- Admin module registry: `maestro/memory/modules/domains/admin-module-registry/`
- Collection Table: `maestro/memory/modules/domains/collection-table/`
- Backend runtime: `maestro/memory/modules/backend/runtime/`
- Backend auth gateway: `maestro/memory/modules/backend/auth-gateway/`
- Backend migrations: `maestro/memory/modules/backend/migrations/`
- Backend admin modules: `maestro/memory/modules/backend/admin-modules/`
- Platform Studio backend/Form Builder: `maestro/memory/modules/backend/platform-studio-form-builder/`
- Platform Studio backend/Navigation Builder: `maestro/memory/modules/backend/platform-studio-navigation-builder/`
