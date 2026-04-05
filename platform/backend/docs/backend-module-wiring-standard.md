# Backend Module Wiring Standard

Status: accepted
Scope: Go backend application runtimes under `cmd/.../internal/server`

## Goal

Keep backend module composition explicit, testable, and readable.

The application runtime should assemble module dependencies in the application composition root, while module packages keep business logic and storage logic separate.

## Fixed decision

Module wiring belongs in the application runtime layer, not inside domain module packages.

Preferred placement:

- `cmd/<app>/internal/server/bootstrap.go`
- `cmd/<app>/internal/server/wiring_<module>.go`
- `cmd/<app>/internal/server/routes_<module>.go`

Preferred package:

- `package server`

Do not create a separate `package wiring` by default.

## File placement

Use this shape:

- `cmd/api-admin/internal/server/bootstrap.go`
- `cmd/api-admin/internal/server/wiring_admin_profile.go`
- `cmd/api-admin/internal/server/routes_admin_profile.go`
- `cmd/api-admin/internal/server/wiring_tenant_management.go`
- `cmd/api-admin/internal/server/routes_tenant_management.go`

- `cmd/api-tenant/internal/server/bootstrap.go`
- `cmd/api-tenant/internal/server/wiring_profile.go`
- `cmd/api-tenant/internal/server/routes_profile.go`

If `auth` grows further, use the same pattern:

- `cmd/auth/internal/server/wiring_<module>.go`
- `cmd/auth/internal/server/routes_<module>.go`

## Naming rule

Each module wiring file should expose one build helper:

- `buildAdminProfileModule(...)`
- `buildTenantManagementModule(...)`
- `buildTenantProfileModule(...)`

The helper should return the outermost application surface needed by the server, usually:

- `*Handler`

If a module exposes multiple runtime surfaces, the helper may return a small bundle struct instead.

Each route file should expose one route registration helper:

- `registerAdminProfileRoutes(...)`
- `registerTenantManagementRoutes(...)`
- `registerModuleRegistryRoutes(...)`

The helper should attach the full route family for that module, including any temporary alias routes that exist during migration windows.

Route family policy:

- secure canonical backend routes should use their accepted runtime prefix, for example `/app/...`
- do not add legacy aliases by default
- temporary aliases are allowed only as an explicit migration bridge and should be removed once the caller is aligned

## Composition rule

`bootstrap.go` should remain readable and should call build helpers instead of assembling every module inline.

Preferred style:

```go
server.adminProfileHT = buildAdminProfileModule(server.sqlClient)

server.tenantManagementHT, err = buildTenantManagementModule(server.sqlClient, cfg, logger)
if err != nil {
	return nil, err
}
```

Avoid long inline chains such as:

```go
repo := module.NewRepository(sqlClient)
svc := module.NewService(repo, logger, cfg)
handler := module.NewHandler(svc)
```

repeated many times directly inside `bootstrap.go`.

`routes.go` should also remain readable and should delegate route-family registration to per-module helpers instead of holding every module endpoint inline.

Preferred style:

```go
srv.registerAdminProfileRoutes(b)
srv.registerTenantManagementRoutes(b)
srv.registerModuleRegistryRoutes(b)
```

## Constructor rule

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
- it pushes composition into the module constructor
- it makes testing and replacement harder
- it couples service construction to application infrastructure

## Repository rule

Repository constructors may accept infrastructure dependencies such as:

- `sqlClient`
- `logger`

That is normal because repository is the storage boundary.

Example:

```go
repo := module.NewRepository(sqlClient, logger)
```

## Config rule

Do not pass whole application config into a service unless the service truly needs the whole object.

Preferred:

- normalize app config in wiring
- pass a module-specific config struct to the module or provisioner

Example:

```go
var c tenantmanagement.Config
_ = cfg.Unmarshal("", &c)
svc := tenantmanagement.NewService(repo, provisioner, logger, c.Onboarding)
```

## Logger rule

Pass `logger` into a service only if the service itself logs or makes logging decisions.

If only the repository logs, give the logger to the repository, not automatically to the service.

## Provisioner / helper services

If a module service depends on another internal helper such as:

- provisioner
- notifier
- scheduler
- policy reader

that helper should be created in wiring and injected into the service.

Preferred:

```go
repo := module.NewRepository(sqlClient, logger)
provisioner := module.NewProvisioner(sqlClient, moduleCfg, logger)
svc := module.NewService(repo, provisioner, logger, moduleCfg)
```

## Responsibility split

### `wiring_<module>.go`

Owns:

- dependency assembly
- module config extraction
- constructor ordering

Does not own:

- business decisions
- SQL
- transport behavior

### `routes_<module>.go`

Owns:

- route registration for one module surface
- explicitly approved temporary alias routes when needed
- transport-to-handler connection for that module

Does not own:

- module dependency construction
- business decisions
- SQL

### `service.go`

Owns:

- business/use-case orchestration
- decision making
- error handling policy
- calls to repository and helper services

### `repository.go`

Owns:

- SQL and storage interaction
- storage mapping

### `handler.go`

Owns:

- transport DTO handling
- request/response shaping
- transport error mapping

## Allowed exception

Factory-style `NewService(sqlClient, cfg, logger)` is allowed only when a module is intentionally acting as a self-contained factory and there is a strong reason not to expose its internal dependency graph.

This is the exception, not the default.

New code should prefer explicit dependency injection plus application-layer wiring helpers.

## Adoption rule

When touching an existing backend application bootstrap:

1. keep behavior unchanged
2. move module assembly into `wiring_<module>.go`
3. move route-family registration into `routes_<module>.go` when the module has a meaningful route surface
4. prefer dependency-based service constructors
5. avoid broad constructor signatures unless the service truly uses those dependencies
