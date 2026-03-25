# Frontend Workspace

Canonical frontend workspace for the multi-tenant platform.

## Apps

- `apps/platform-admin-web`: internal admin and backoffice surface
- `apps/tenant-web`: tenant-scoped user surface

## Shared Packages

- `packages/design-tokens`
- `packages/ui-kit`
- `packages/api-client`
- `packages/auth-core`
- `packages/tenant-core`
- `packages/app-shell`
- `packages/forms`

## Docs

See `docs/README.md` for the active frontend documentation set.

## Local HTTPS

Local HTTPS is handled by Caddy and is intended for development only.

- `pnpm dev:hosts`: add local host mappings
- `pnpm dev:trust-caddy`: trust the local Caddy CA
- `pnpm dev:https`: run Vite apps plus the local HTTPS proxy, or reuse existing app dev servers on ports `5173` and `5174`
- `pnpm dev:proxy`: run only the local HTTPS proxy when the apps are already running

Configured local domains:

- `https://admin.platform.local`
- `https://demo.platform.local`

## Build Targets

- `pnpm build:admin:dev`
- `pnpm build:admin:prod`
- `pnpm build:tenant:dev`
- `pnpm build:tenant:prod`

App-level equivalents:

- `pnpm --filter @platform/platform-admin-web build:dev`
- `pnpm --filter @platform/platform-admin-web build:prod`
- `pnpm --filter @platform/tenant-web build:dev`
- `pnpm --filter @platform/tenant-web build:prod`
