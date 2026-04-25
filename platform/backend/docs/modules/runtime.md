# Backend Runtime Module

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: current backend runtime shape and foundation boundaries

This module doc defines the current backend runtime shape.
Use it before opening older restructuring plans.

Read with:

- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/contracts/auth-gateway.md`

## Current Backend Shape

- Backend is a modular monolith with multiple runtime entrypoints.
- Current runtime entrypoints are `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, and `cmd/migrate`.
- `cmd/worker` is future/deferred and not present in the active backend tree.
- `cmd/scapi` is retired and must not be recreated as an active runtime.
- PostgreSQL is the target runtime database.
- Cognito is not part of the target authentication model.
- Auth targets backend-issued RSA JWTs, JWKS, and gateway validation.

## Runtime Responsibilities

### `cmd/api-admin`

Control-plane and master-level administration API.

Current responsibility includes:

- admin profile and navigation
- tenant onboarding and tenant management
- tenant list and tenant inventory
- Module Registry list/manage/grants
- Employees admin collection surface
- admin access policy route binding

### `cmd/api-tenant`

Tenant-scoped application API.

Current responsibility includes:

- tenant profile/runtime endpoints
- tenant-scoped Platform Studio Form Builder backend
- future tenant modules through explicit module packages and route families

### `cmd/auth`

Authentication runtime.

Current responsibility includes:

- OTP request and verification
- access token issue
- refresh token lifecycle
- logout and session revocation
- JWKS publication
- auth event logging

### `cmd/migrate`

Dedicated migration runtime.

Current responsibility includes:

- master migrations
- tenant database migrations
- schema migration tracking
- tenant bundle generation support

API startup must not own schema migration execution.

## Module Layout

Current backend module roots:

- `platform/backend/modules/admin`
- `platform/backend/modules/tenant`
- `platform/backend/modules/shared`

Current platform infrastructure root:

- `platform/backend/internal/platform`

Root `internal/` should contain platform infrastructure only.
Business logic belongs in `modules/*`.

## Active Foundation Boundaries

Use `internal/platform/*` for infrastructure and runtime primitives:

- `internal/platform/appenv`
- `internal/platform/appinfo`
- `internal/platform/auth`
- `internal/platform/config`
- `internal/platform/hosting`
- `internal/platform/httpx`
- `internal/platform/logging`
- `internal/platform/notify`
- `internal/platform/options`
- `internal/platform/postgres`
- `internal/platform/tenant`

Do not create new root `internal/*` business packages.

## Module Responsibility Rules

- Handlers stay thin.
- Business logic belongs in services.
- Persistence belongs in repositories or platform storage layers.
- SQL does not belong in handlers.
- Transport DTOs must not leak into repository logic.
- Module wiring stays in `cmd/<app>/internal/server`.
- Runtime route ownership stays explicit.

## Preserved Target Decisions

- The platform remains a modular monolith.
- Tenant-aware design is required.
- Tenant-aware application tables retain `tenant_id`.
- Dedicated tenant databases may still keep `tenant_id` for portability and operational consistency.
- Tenant scope must come from trusted runtime context.
- Master DB owns control-plane and routing/auth-related data.
- Tenant DBs own tenant application data.

## Compatibility Pointers

Pointer-only compacted runtime map, foundation, and module wiring files were
deleted after compaction. Use git history only when exact old text is required.
