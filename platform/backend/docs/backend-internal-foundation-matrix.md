# Backend Internal Foundation Matrix

Status: active working matrix
Scope: `platform/backend/internal/*` decomposition into `internal/platform/*`, `modules/*`, and legacy removal
Date: 2026-03-29

## Goal

This matrix is the execution map for cleaning up `platform/backend/internal/*`.

Rules:

- platform or infrastructure code moves to `internal/platform/*`
- business logic does not stay in `internal/*`
- mixed packages must be split by responsibility
- duplicated root `internal/*` packages are removed; root `internal/` now contains only `platform/`

## Matrix

| Current package or surface | Target package | Classification | Status | Notes |
| --- | --- | --- | --- | --- |
| `internal/config/*` | `internal/platform/config/*` | platform | started | Platform copy created and active runtimes switched. Still depends on `internal/utils` for app path helpers. |
| `internal/hosting/*` | `internal/platform/hosting/*` | platform | started | Platform copy created and active runtimes switched. Still depends on `internal/utils` transitively through logging or windows service helpers. |
| `internal/logging/*` | `internal/platform/logging/*` | platform | started | Platform copy created. Still depends on `internal/utils` for app name and log file defaults. |
| `internal/options/*` | `internal/platform/options/*` | platform | started | Platform copy created. Still depends on `internal/utils` for env file path and app naming. |
| `internal/notify/*` | `internal/platform/notify/*` | platform | started | Platform copy created and active shared notification service switched. |
| `internal/postgres/*` | `internal/platform/postgres/*` | platform | started | Platform copy created and active runtimes or shared modules switched. |
| `internal/httpx/apperr/*` | `internal/platform/httpx/apperr/*` | platform | started | Platform copy created and active modules switched. |
| `internal/httpx/claims/*` | `internal/platform/httpx/claims/*` | platform | started | Platform copy created and active auth context parsing switched. |
| `internal/httpx/handler/*` | `internal/platform/httpx/handler/*` | platform | started | Platform copy created and active runtimes switched. |
| `internal/httpx/mw/*` | `internal/platform/httpx/mw/*` | platform | started | Platform copy created and active runtimes switched. |
| `internal/httpx/requestctx/*` | `internal/platform/httpx/requestctx/*` | platform | started | Platform copy created and active runtimes plus shared modules switched. |
| `internal/httpx/router/*` | `internal/platform/httpx/router/*` | platform | started | Platform copy created and active runtimes switched. |
| `internal/cors/*` | `legacy-delete` | legacy-delete | pending | Not needed by the new runtime chain. Remove after root legacy package cleanup. |
| `internal/auth/jwt_issuer.go` | `internal/platform/auth/jwt_issuer.go` | split-platform | started | Platform copy created and active runtimes switched. |
| `internal/auth/jwks.go` | `internal/platform/auth/jwks.go` | split-platform | started | Platform copy created and active auth runtime switched. |
| `internal/auth/jwt_claims.go` | `internal/platform/auth/jwt_claims.go` | split-platform | started | Platform copy created and active auth runtime switched. |
| `internal/auth/claim_resolver.go` | `internal/platform/auth/claim_resolver.go` | split-platform | started | Active platform resolver is now self-issued token only. Legacy provider branching remains outside active runtime. |
| `internal/auth/context_claims.go` | `internal/platform/auth/context_claims.go` | split-platform | started | Active platform claim parsing is now self-issued token only and supports email or phone auth. |
| `internal/auth/otp_generator.go` | `internal/platform/auth/otp_generator.go` | split-platform | started | Platform copy created and active auth runtime switched. |
| `internal/auth/otp_hash.go` | `internal/platform/auth/otp_hash.go` | split-platform | started | Platform copy created and active auth runtime switched. |
| `internal/auth/rate_limiter.go` | `internal/platform/auth/rate_limiter.go` | split-platform | started | Platform copy created and active auth runtime switched. |
| `internal/auth/otp_repo.go` | `modules/shared/authentication/repository_pg.go` | split-module | started | Module-owned OTP repository created and active auth runtime switched. |
| `internal/auth/refresh_repo.go` | `modules/shared/sessions/repository_pg.go` | split-module | started | Module-owned refresh token repository created and active auth runtime switched. |
| `internal/auth/membership_repo.go` | `legacy-delete` | legacy-delete | completed | Direct tenant auth removed the need for master identity membership lookup. |
| `internal/auth/types.go` | `modules/shared/sessions/*` or `legacy-delete` | split-legacy | completed | Identity-specific types are retired; only session types remain in active runtime. |
| `internal/identity/*` | `legacy-delete` | legacy-delete | completed | Global identity mirror is removed from the active auth contour. |
| `internal/tokencoder/*` | `internal/platform/auth/*` | platform | started | Platform token codec copy created and active tenant validation switched. Old root package still remains to be deleted. |
| `internal/utils/*` | `split or legacy-delete` | split-legacy | started | Active platform code now uses `internal/platform/appinfo/*` instead of `internal/utils`. Legacy still depends on old utils package. |
| `internal/platform/tenant/*` | `internal/platform/tenant/*` | platform | active | Already on target path. Needs import cleanup only. |
| `internal/platform/tenant/token_schema.go` | `modules/shared/forms/public_link_token.go` | split-module | started | Public survey link token semantics moved out of platform into shared forms module for active runtime. |
| `internal/platform/httpx/middleware/*` | `internal/platform/httpx/middleware/*` | platform | active | Already on target path. Now aligned to `internal/platform/httpx/*`. |

## First Block Scope

The first foundation block is:

- `config`
- `hosting`
- `logging`
- `options`
- `notify`
- `postgres`
- `httpx`

For this block the migration strategy is:

1. Create additive copies under `internal/platform/*`
2. Switch active non-legacy runtimes and shared modules to platform imports
3. Keep legacy duplicated root `internal/*` packages only until active import cleanup is finished
4. Remove old imports from active code before deleting legacy packages

Current progress:

- active runtimes and shared modules no longer import `internal/utils`
- active runtimes and shared modules no longer import `internal/auth`
- active runtimes and shared modules no longer import `internal/identity`
- active auth runtime no longer depends on any `modules/shared/identity/*` surface
- active runtimes no longer use `Token.Provider`; active auth is self-issued token only
- root `internal/` now contains only `internal/platform/*`
- `cmd/scapi` is removed from the active backend tree

## Current Active Import Policy

These packages should now prefer `internal/platform/*` and not `internal/*`:

- `cmd/auth/*`
- `cmd/api-tenant/*`
- `cmd/migrate/*`
- `modules/shared/*`
- `modules/tenant/profile/*`
- `internal/platform/*`

Legacy exception:

- none in the active runtime tree

## Follow-up After This Cut

1. Finish `internal/platform/auth/*` extraction from mixed `internal/auth`
2. Remove active runtime dependence on `internal/utils`
3. Delete `internal/identity/*` and keep direct tenant auth as the accepted model
4. Delete `internal/cors/*` after legacy removal
5. Root duplicated foundation packages are removed; remaining follow-up is expanding modules and runtimes on top of `internal/platform/*`
