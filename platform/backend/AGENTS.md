# Backend Workspace Guidance

Scope: `platform/backend` only.

Responsibility: backend implementation rules only: runtime surfaces,
transport/service/repository boundaries, auth/tenant constraints,
schema/migration guardrails, commands, tests, and backend docs update
expectations. Maestro runtime owns agent/tool selection, artifacts, approval
gates, release/deploy orchestration, and closeout behavior.

Read first:

1. `platform/AGENTS.md`
2. `maestro/memory/START_HERE.md`
3. `maestro/memory/index/read-routes.yaml`
4. relevant module pack under `maestro/memory/modules/**`
5. `platform/backend/docs/README.md`

Use `maestro/memory/index/memory-index.yaml` only when broader routing is needed.

## Orchestration rule

For new backend work, the preferred entrypoint is Maestro when the task is
ambiguous, cross-stack, high-risk, or likely to need durable evidence. Tiny
backend-local edits may stay direct in the current chat.

## Focus

This directory is for foundation-stage and production-oriented Go backend work inside a multi-tenant platform.

Primary active runtime surfaces:

- `cmd/api-admin`
- `cmd/api-tenant`
- `cmd/auth`
- `cmd/migrate`

## Architectural rules

- preserve transport -> service -> repository separation
- do not put SQL in handlers
- do not leak transport DTOs into repository logic
- keep module wiring in `cmd/<app>/internal/server`
- prefer `bootstrap.go`, `wiring_<module>.go`, and `routes_<module>.go` in `package server`
- keep `bootstrap.go` and top-level `routes.go` readable by delegating to `build*Module(...)` and `register*Routes(...)`
- do not create a separate `package wiring` by default
- service constructors should take only the dependencies they actually use
- repositories may take infrastructure dependencies such as `sqlClient` and `logger`
- normalize app config in wiring and pass module-specific config into services
- keep admin and tenant semantics explicit
- keep tenancy and auth derivation in trusted runtime context
- do not trust user-supplied tenant ids for auth or tenancy decisions
- `api-admin` and `api-tenant` own canonical secure routes under `/app/...`
- `auth` owns explicit `/auth/...` routes
- do not add legacy route aliases unless an explicit migration bridge is approved
- `GET /app/profile` stays profile-only; admin navigation is projected separately via `GET /app/me/navigation`
- production target is gateway-first auth with trusted headers; local or compatibility mode may use bearer validation
- do not reintroduce a master identity mirror for tenant login identities
- `auth` resolves `tenant_host -> tenant_id -> tenant_db` in master and reads auth-facing user identity from tenant-local `users`
- platform and infrastructure code belongs in `internal/platform/*`; business logic does not stay in root `internal/*`
- non-root admin access must stay bound to explicit route-to-section policy in code
- do not expose non-root admin sections in navigation unless secure route coverage exists
- do not add privileged bypasses without explicit approval
- `cmd/migrate` owns schema changes
- master schema source of truth is `migrations/postgres/master/*.sql`
- tenant schema source of truth is `bundle/tenant_schema_full.sql` plus `migrations/postgres/tenant/*.sql`
- `docs/MSSQL/*` is mapping reference only, not active runtime DDL
- master schema uses modern snake_case; tenant business tables target legacy-compatible prefixed naming when schema work touches that boundary
- do not let module-registry page assumptions redefine the generic shared collection-table helpers

## File size guardrails

- Treat line counts as maintainability heuristics, not hard limits.
- Split backend code by responsibility before adding non-trivial logic to large files.
- Keep transport handlers/controllers, validation, authorization/tenant checks, services/use cases, repositories/queries, mappers/DTOs, and tests/fixtures distinct.
- Prefer handlers around 300-500 lines, services around 400-700 lines, and repository/query modules around 400-800 lines.
- If a backend file exceeds roughly 700-1000 lines and mixes concerns, propose a responsibility split before extending it.
- DTO/contract/schema files may be larger when mostly declarative.
- Tests may be larger, but when they exceed roughly 800-1200 lines, prefer splitting by behavior or fixture scope.
- Do not split mechanically in ways that obscure transaction boundaries, auth/tenant checks, schema ownership, or error mapping.

## Default ignore set

Do not read by default:

- `docs/legacy/**`
- `migrations/postgres/archive/**`
- `bundle/tenant_schema_full.sql` unless the task is bundle/migration specific
- `certs/**`
- deleted legacy AI memory path `../docs/ai/**`; use `maestro/memory/durable/legacy-memory-import.md` and git history only for explicit historical reconstruction
- archived prompts under `platform/**`

## High-risk areas

Treat these as confirmation-required before finalizing changes:

- auth/session contracts
- tenant resolution or tenant isolation
- grants, roles, or root/non-root access
- migrations, seed data, bundle generation
- destructive admin actions
- export or billing logic

## Commands

Primary checks:

- `go test ./...`
- `go build ./cmd/...`

Targeted checks:

- `go test ./cmd/...`
- `go test ./modules/...`

Migration and local bootstrap:

- `go run ./cmd/migrate --env ./env/migrate.local.env.example`
- `psql -d postgres -f ./seeds/local/001_create_databases.sql`
- `psql -d 108-master -f ./seeds/local/010_master_seed.sql`
- `psql -d 108-sandbox -v tenant_id=100 -f ./seeds/local/020_sandbox_tenant_seed.sql`
- `psql -d 108-demo -v tenant_id=101 -f ./seeds/local/021_demo_tenant_seed.sql`

Local runtimes:

- `go run ./cmd/auth --env ./env/auth.local.env.example`
- `go run ./cmd/api-admin --env ./env/api-admin.local.env.example`
- `go run ./cmd/api-tenant --env ./env/api-tenant.local.env.example`

Local key generation:

- `./scripts/generate-dev-auth-keys.sh`

## Required tests

For non-trivial backend work, cover as applicable:

- unit/service tests
- handler/API tests
- auth negative case
- permission negative case
- tenant-scope negative case
- migration smoke if schema changed

## Docs update rule

Update docs when code changes any of these:

- auth/session contract
- navigation/grants contract
- schema or migration contract
- admin/tenant boundary
- module wiring standard
- module-registry endpoint or rollout contract
- shared collection-table helper contract

## Summary format

- Goal
- Target runtime or module
- Changed packages/files
- API changes
- DB/migration changes
- Auth/tenant implications
- Tests run
- Risks / follow-ups
