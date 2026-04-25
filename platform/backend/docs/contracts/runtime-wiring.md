# Backend Runtime Wiring Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: Go backend application composition under `cmd/<app>/internal/server`

This contract defines where backend runtime composition, module wiring, and route registration belong.

## Goal

Backend runtime composition must stay explicit, testable, and readable.

Application runtimes assemble module dependencies in their composition root.
Domain module packages own business behavior and storage boundaries, not application wiring.

## Current Runtime Roots

- `platform/backend/cmd/api-admin`
- `platform/backend/cmd/api-tenant`
- `platform/backend/cmd/auth`
- `platform/backend/cmd/migrate`

`cmd/worker` is future/deferred and must not be treated as an active runtime until it exists in code.

## Composition Placement

Module wiring belongs in the application runtime layer:

- `cmd/<app>/internal/server/bootstrap.go`
- `cmd/<app>/internal/server/wiring_<module>.go`
- `cmd/<app>/internal/server/routes_<module>.go`

Preferred package:

- `package server`

Do not create a separate `package wiring` by default.

## Current File Pattern

Examples from the active tree:

- `cmd/api-admin/internal/server/bootstrap.go`
- `cmd/api-admin/internal/server/wiring_tenant_management.go`
- `cmd/api-admin/internal/server/routes_tenant_management.go`
- `cmd/api-admin/internal/server/wiring_module_registry_list.go`
- `cmd/api-admin/internal/server/routes_module_registry_list.go`
- `cmd/api-tenant/internal/server/bootstrap.go`
- `cmd/api-tenant/internal/server/wiring_profile.go`
- `cmd/api-tenant/internal/server/wiring_platform_studio_form_builder.go`
- `cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- `cmd/auth/internal/server/bootstrap.go`
- `cmd/auth/internal/server/routes.go`

## Naming Rule

Each module wiring file should expose one build helper:

- `buildAdminProfileModule(...)`
- `buildTenantManagementModule(...)`
- `buildTenantProfileModule(...)`

The helper should return the outermost application surface needed by the server, usually `*Handler`.
If a module exposes multiple runtime surfaces, the helper may return a small bundle struct.

Each route file should expose one route registration helper:

- `registerAdminProfileRoutes(...)`
- `registerTenantManagementRoutes(...)`
- `registerModuleRegistryRoutes(...)`

The helper attaches the full route family for that module.

## Route Policy

- Secure canonical backend routes should use accepted runtime prefixes such as `/app/...`.
- Do not add legacy aliases by default.
- Temporary aliases are allowed only as explicit migration bridges and should be removed after callers align.
- Admin and tenant semantics must stay explicit.
- Tenant scope must come from trusted runtime context, not from arbitrary user input.

## Bootstrap Rule

`bootstrap.go` should remain readable and call build helpers instead of assembling every module inline.

Preferred style:

```go
server.adminProfileHT = buildAdminProfileModule(server.sqlClient)

server.tenantManagementHT, err = buildTenantManagementModule(server.sqlClient, cfg, logger)
if err != nil {
	return nil, err
}
```

Avoid repeating long constructor chains directly inside `bootstrap.go`.

## Constructor Rule

Service constructors should receive only the dependencies they actually use.

Preferred:

```go
func NewService(repo Repository) *Service
func NewService(repo Repository, logger *slog.Logger) *Service
func NewService(repo Repository, notifier Notifier, cfg ModuleConfig, logger *slog.Logger) *Service
```

Discouraged as the default:

```go
func NewService(sqlClient *postgres.Client, cfg *config.Config, logger *slog.Logger) *Service
```

Reason:

- it hides the dependency graph
- it pushes composition into module constructors
- it makes tests and replacement harder
- it couples service construction to application infrastructure

## Responsibility Split

`wiring_<module>.go` owns:

- dependency assembly
- module config extraction
- constructor ordering

`wiring_<module>.go` does not own:

- business decisions
- SQL
- transport behavior

`routes_<module>.go` owns:

- route registration for one module surface
- explicitly approved temporary alias routes
- transport-to-handler connection for that module

`routes_<module>.go` does not own:

- module dependency construction
- business decisions
- SQL

`service.go` owns:

- business and use-case orchestration
- decision making
- error handling policy
- calls to repositories and helper services

`repository.go` owns:

- SQL and storage interaction
- storage mapping

`handler.go` owns:

- transport DTO handling
- request and response shaping
- transport error mapping

## Adoption Rule

When touching an existing backend application bootstrap:

1. Keep behavior unchanged.
2. Move module assembly into `wiring_<module>.go`.
3. Move route-family registration into `routes_<module>.go` when the module has a meaningful route surface.
4. Prefer dependency-based service constructors.
5. Avoid broad constructor signatures unless the service truly uses those dependencies.
