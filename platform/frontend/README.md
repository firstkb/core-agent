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
- `packages/platform-builder-core`

## Docs

See `docs/README.md` for the active frontend documentation set.

## Local HTTPS

Local HTTPS is handled by Caddy and is intended for development only.

- `pnpm dev:hosts`: add local host mappings
- `pnpm dev:trust-caddy`: trust the root-mode / launchd Caddy CA
- `pnpm dev:trust-caddy:user`: trust the user-mode high-port Caddy CA
- `pnpm dev:https`: legacy foreground root-mode proxy on `443` with `caffeinate`
- `pnpm dev:stack:https`: legacy full stack root-mode proxy on `443` with `caffeinate`
- `pnpm dev:https:launchd`: run frontend apps with launchd-managed Caddy on `443` and hold a `caffeinate` assertion for the session
- `pnpm dev:stack:https:launchd`: run frontend plus backend with launchd-managed Caddy on `443` and hold a `caffeinate` assertion
- `pnpm dev:proxy:launchd:install`: install and start the launchd daemon on `443`
- `pnpm dev:proxy:launchd:status`: inspect the launchd daemon
- `pnpm dev:https:user`: run Vite apps plus a user-level Caddy proxy on `8443`
- `pnpm dev:stack:https:user`: run frontend apps, backend APIs, and a user-level Caddy proxy on `8443`
- `pnpm dev:proxy:user`: run only the user-level high-port proxy when the apps are already running
- `pnpm dev:proxy`: run only the legacy root-mode proxy when the apps are already running

Configured local domains:

- `https://admin.platform.local`
- `https://demo.platform.local`
- `https://acme.platform.local`

User-mode high-port equivalents:

- `https://admin.platform.local:8443`
- `https://demo.platform.local:8443`
- `https://acme.platform.local:8443`

Same-site dev routing:

- `/` -> frontend app
- `/api/v1/*` -> app API
- `/auth/v1/*` -> auth API

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
