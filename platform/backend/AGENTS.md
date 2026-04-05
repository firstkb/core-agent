# Backend Workspace Guidance

Scope: `platform/backend` only.

Read first:

1. `platform/AGENTS.md`
2. `platform/docs/ai/README.md`
3. `platform/docs/ai/current-state.md`
4. relevant module docs under `platform/docs/ai/modules/`
5. `platform/backend/docs/README.md`

## Lane orchestration rule

During the v1 pilot, the preferred entrypoint for new backend work is `Atlas` (`$ramp-conductor`).
Atlas may route the task to:
- direct backend no-run work
- `BE_ONLY` run-backed work
- cross-stack coordinated work

Use this lane directly only when:
- the task is obviously tiny and backend-local
- or Atlas already issued a backend packet

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
- keep admin and tenant semantics explicit
- keep tenancy and auth derivation in trusted runtime context
- do not add privileged bypasses without explicit approval
- `cmd/migrate` owns schema changes
- do not let module-registry page assumptions redefine the generic shared collection-table helpers

## Default ignore set

Do not read by default:

- `docs/legacy/**`
- `migrations/postgres/archive/**`
- `bundle/tenant_schema_full.sql` unless the task is bundle/migration specific
- `certs/**`
- archived prompts under `platform/docs/archive/**`

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
