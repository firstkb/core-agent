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

### 2026-03-30 — Platform Studio stays app-local in `tenant-web`

Status: active  
Decision:

- shared builder layer is `platform-studio-core` for typed contracts only
- builder UI stays app-local until reuse or backend maturity justifies more extraction

Primary sources:

- `platform/docs/ai/modules/platform-studio.md`

### 2026-04-07 — Platform Studio taxonomy and shared core naming are locked

Status: active  
Decision:

- `Platform Studio` is the umbrella product surface
- `Form Builder`, `Navigation Builder`, and `Action Builder` are tool names under that umbrella
- the shared non-UI package is `@platform/platform-studio-core`
- separate per-builder shared packages are deferred until reuse and API stability are real
- active Form Builder UI language is `Model` and `View`
- legacy `EntityDefinition` and `FieldDefinition` names may remain only as compatibility aliases during migration

Primary sources:

- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`
- `platform/docs/ai/modules/platform-studio.md`

### 2026-04-07 — Form Builder locks its first integration contract before backend parallelization

Status: active  
Decision:

- FE/BE parallelization starts only after the first Form Builder contract is locked
- the first locked contract covers model list/detail, view list/detail, layout draft tree, locks, and save semantics
- create/delete/clone/export/publish flows remain out of the first backend slice
- canonical Form Builder route model is `/builder/forms`, `/builder/forms/:modelId`, `/builder/forms/:modelId/views/:viewId`

Primary sources:

- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`

### 2026-04-05 — Collection Table is a separate shared-runtime domain from Admin Module Registry

Status: active  
Decision:

- `Collection Table` and `Admin Module Registry` use separate memory domains
- module registry is the current proving surface for the table, but it does not own the collection-table contract
- package promotion for collection-table must wait for real reuse proof and approved package boundaries

Primary sources:

- `platform/docs/ai/modules/collection-table.md`
- `platform/docs/ai/modules/admin-module-registry.md`

### 2026-04-06 — Employees keeps technical module key `users`

Status: active  
Decision:

- the control-plane module keeps technical key `users`
- the user-facing module title is `Employees`
- the root-only section title is `List of Employees`
- this section is backed by platform `admin_user` data, not tenant users

Primary sources:

- `platform/backend/migrations/postgres/master/110_admin_employees_rollout.sql`
- `platform/backend/modules/admin/employeeslist`

### 2026-04-06 — Collection Table frontend package is extracted for admin-app consumers

Status: active  
Decision:

- `Employees / List of Employees` is the second real admin-app consumer for collection-table
- the shared frontend runtime/page host now lives in `@platform/collection-table`
- admin app pages stay thin and host-owned for auth/session, API prefix, and route-specific actions
- this extraction does not by itself complete admin/tenant cross-app adoption

Primary sources:

- `platform/docs/ai/modules/collection-table.md`
- `platform/frontend/packages/collection-table`

### 2026-04-06 — Collection Table keeps an explicit shared capability backlog

Status: active  
Decision:

- package extraction does not mean the full optional capability set is complete
- shared FE/BE support for `XLS export`, row action `view`, and row action `pdf` remains required backlog
- these capabilities are opt-in by table surface, not mandatory on every consumer
- they must be implemented as shared collection-table capabilities rather than screen-local hacks

Primary sources:

- `platform/docs/ai/modules/collection-table.md`
- `platform/docs/ai/current-state.md`

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
