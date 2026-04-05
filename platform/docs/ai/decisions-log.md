# Decisions Log

Status: active
Bootstrapped on 2026-04-05 from current docs and code.

Use this file only for durable decisions.
Do not turn it into a task journal.

## Active decisions

### 2026-03-29 — Platform stays monorepo + modular monolith

Status: active  
Decision:

- keep one monorepo
- keep backend as modular monolith
- defer microservice extraction

Primary sources:

- `platform/docs/ai/platform-contract.md`
- `platform/docs/ai/repo-map.md`

Origin notes:

- `platform/backend/docs/ramp_v_108_backend_standard_v_2.md` (historical)

### 2026-03-29 — Frontend is split by product surface

Status: active  
Decision:

- separate frontend apps for admin and tenant surfaces
- do not collapse them into one route-only app

Primary sources:

- `platform/docs/ai/platform-contract.md`
- `platform/docs/ai/repo-map.md`

### 2026-03-29 — Backend uses multiple runtimes, not one giant executable

Status: active  
Decision:

- `api-admin`, `api-tenant`, `auth`, and `migrate` are separate runtimes

Primary sources:

- `platform/docs/ai/repo-map.md`
- `platform/backend/cmd/*`

### 2026-03-29 — Migrations belong to `cmd/migrate`

Status: active  
Decision:

- app runtimes must not run schema migrations during startup

Primary sources:

- `platform/docs/ai/modules/schema-and-tenancy.md`
- `platform/backend/cmd/migrate`

### 2026-03-29 — PostgreSQL is the target runtime database

Status: active  
Decision:

- PostgreSQL is the current target runtime database
- MSSQL material is legacy reference, not target contract

Primary sources:

- `platform/docs/ai/modules/schema-and-tenancy.md`

### 2026-03-29 — Tenant-aware design retains `tenant_id`

Status: active  
Decision:

- keep `tenant_id` on application tables even when dedicated databases exist

Primary sources:

- `platform/docs/ai/modules/schema-and-tenancy.md`

### 2026-03-29 — Backend module import path stays `dtriton.com/platform/backend`

Status: active  
Decision:

- backend module path is intentionally decoupled from the current repository host path

Primary sources:

- `platform/backend/go.mod`
- `platform/docs/ai/repo-map.md`

### 2026-03-29 — Auth uses self-issued RSA JWT + JWKS

Status: active  
Decision:

- `api-admin` and `api-tenant` target JWT validation against self-issued tokens and JWKS

Primary sources:

- `platform/docs/ai/modules/auth-and-session.md`
- `platform/backend/cmd/auth/internal/server/routes.go`

### 2026-03-30 — Refresh token is cookie-only

Status: active  
Decision:

- frontend must not store refresh token in JavaScript
- refresh/logout must use cookie-backed auth endpoints

Primary sources:

- `platform/docs/ai/modules/auth-and-session.md`

### 2026-03-30 — `/app/profile` remains profile-only

Status: active  
Decision:

- profile bootstrap must stay separate from admin navigation payloads

Primary sources:

- `platform/docs/ai/modules/admin-control-plane.md`

### 2026-04-02 — Admin navigation is projected through `/app/me/navigation`

Status: active  
Decision:

- admin sidebar/navigation must come from `GET /app/me/navigation`

Primary sources:

- `platform/docs/ai/modules/admin-control-plane.md`

### 2026-04-02 — Secure admin API routes use `/app/...`

Status: active  
Decision:

- canonical secure admin route family is `/app/...`
- do not reintroduce legacy `/admin/...` or `/api/admin/...` API shapes without an explicit bridge plan

Primary sources:

- `platform/docs/ai/modules/admin-control-plane.md`

### 2026-04-02 — Module Registry is root-only

Status: active  
Decision:

- module registry UI and management stay root-only

Primary sources:

- `platform/docs/ai/modules/admin-module-registry.md`

### 2026-04-02 — Non-root admin access is section-level and allow-only

Status: active  
Decision:

- grants resolve at section level only
- model is allow-only
- current access values are `read` and `write`

Primary sources:

- `platform/docs/ai/modules/admin-control-plane.md`

### 2026-03-20 — No dedicated `tenant-pwa` runtime yet

Status: active  
Decision:

- keep offline support inside `tenant-web` until offline becomes its own runtime concern

Primary sources:

- `platform/docs/ai/platform-contract.md`
- `platform/frontend/AGENTS.md`

### 2026-03-30 — Platform Builder V2 stays app-local in `tenant-web`

Status: active  
Decision:

- shared builder layer is `platform-builder-core` for typed contracts only
- builder UI stays app-local until reuse or backend maturity justifies more extraction

Primary sources:

- `platform/docs/ai/modules/platform-builder-v2.md`

### 2026-04-05 — Collection Table is a separate shared-runtime domain from Admin Module Registry

Status: active  
Decision:

- `Collection Table` and `Admin Module Registry` use separate memory domains
- module registry is the current proving surface for the table, but it does not own the collection-table contract
- package promotion for collection-table must wait for real reuse proof and approved package boundaries

Primary sources:

- `platform/docs/ai/modules/collection-table.md`
- `platform/docs/ai/modules/admin-module-registry.md`

### 2026-04-05 — Canonical docs registry governs markdown truth surfaces

Status: active  
Decision:

- `platform/docs/ai/canonical-docs.md` is the durable registry of which docs are canonical, supporting, or historical
- active domain docs should point back to canonical files instead of duplicating contracts
- prompt artifacts stay in archive, not in active product doc clusters

Primary sources:

- `platform/docs/ai/canonical-docs.md`
- `platform/docs/ai/markdown-governance.md`

### 2026-04-05 — Atlas owns coordinated product-task routing and shared memory updates

Status: active  
Decision:

- use explicit `$ramp-conductor` / `Atlas` for cross-stack, multi-session, or contract-sensitive product work
- Atlas may also route direct one-lane no-run work when that is the cheapest correct path
- FE and BE lanes may return reports and propose memory deltas only
- Atlas owns final shared-memory updates
- prompt and skill/template/script versions are recorded from the automation manifest when a run exists

Primary sources:

- `.agents/skills/ramp-conductor/SKILL.md`
- `platform/docs/ai/prompts/control-chat-prompt-v1.md`
- `platform/docs/ai/automation-manifest.json`

### 2026-04-05 — Prompt contracts, templates, and run artifacts are not durable memory

Status: active  
Decision:

- `prompts/*` are stable operational contracts
- `templates/*` define output shape only
- `runs/*` are execution artifacts and become historical after closeout
- closed runs must not be treated as canonical project truth

Primary sources:

- `platform/docs/ai/README.md`
- `platform/docs/ai/markdown-governance.md`
- `platform/AGENTS.md`

### 2026-04-05 — Automation manifest is the version source for Atlas workflow assets

Status: active  
Decision:

- `platform/docs/ai/automation-manifest.json` is the authoritative editable source of live version values for skill, prompts, templates, and scaffolder
- mirrored version fields in prompts, templates, and the skill file exist for local readability, but must be checked or rewritten from the manifest
- `automation-changelog.md` records behavior changes, but not live version values
- scripts should read from the manifest instead of hardcoding versions in multiple places

Primary sources:

- `platform/docs/ai/automation-manifest.json`
- `scripts/ai/new-run.py`
- `scripts/ai/automation_versions.py`
- `platform/docs/ai/automation-changelog.md`
