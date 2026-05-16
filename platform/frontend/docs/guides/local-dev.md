# Frontend Local Dev Guide

Status: active guide
Owner: frontend
Last audited: 2026-04-25
Canonical scope: frontend local development commands, HTTPS proxy modes, ports, domains, and build/test targets

This guide is the active read path for frontend local development workflow.
It is operational guidance, not a product app ownership contract.

Read with:

- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/contracts/app-surfaces.md`
- `platform/frontend/docs/proposals/pwa-offline.md` only for future offline/PWA scope

Use these docs for product/runtime boundaries:

- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/contracts/app-surfaces.md`
- `platform/frontend/docs/proposals/pwa-offline.md`

## Runtime Assumptions

Frontend workspace:

- package manager: `pnpm@9.4.0`
- Node engine: `>=22.12.0`
- Node version source: `.node-version`, `.nvmrc`, and `package.json` `engines`
- apps: `platform-admin-web` and `tenant-web`
- current delivery: online web applications
- `tenant-pwa`, offline-first behavior, service-worker sync, and Flutter/hybrid mobile are future/deferred scope

Do not treat local HTTPS, manifests, or install prompting as offline/PWA activation.

## Core Commands

`pnpm` uses `.npmrc` `engine-strict=true`; if local `node -v` does not satisfy
the package engine, fix the shell or version manager before running frontend
commands.

Run both frontend apps:

- `pnpm dev`

Run one app:

- `pnpm dev:admin`
- `pnpm dev:tenant`

Build targets:

- `pnpm build:admin:dev`
- `pnpm build:admin:prod`
- `pnpm build:tenant:dev`
- `pnpm build:tenant:prod`

Workspace checks:

- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

Targeted app checks:

- `pnpm --filter @platform/platform-admin-web lint`
- `pnpm --filter @platform/platform-admin-web test`
- `pnpm --filter @platform/platform-admin-web typecheck`
- `pnpm --filter @platform/platform-admin-web build:dev`
- `pnpm --filter @platform/platform-admin-web build:prod`
- `pnpm --filter @platform/tenant-web lint`
- `pnpm --filter @platform/tenant-web test`
- `pnpm --filter @platform/tenant-web typecheck`
- `pnpm --filter @platform/tenant-web build:dev`
- `pnpm --filter @platform/tenant-web build:prod`

## Ports

Frontend dev servers:

- `5173`: `platform-admin-web`
- `5174`: `tenant-web`

Backend local APIs used by the full dev stack:

- `8080`: tenant API
- `8081`: admin API
- `8082`: auth API

HTTPS proxy/admin ports:

- `443`: root or launchd Caddy HTTPS proxy
- `8443`: user-mode high-port Caddy HTTPS proxy
- `2019`: root-mode Caddy admin endpoint
- `2020`: user-mode Caddy admin endpoint

## Local Domains

Configured local hostnames:

- `https://admin.platform.localhost`
- `https://demo.platform.localhost`
- `https://acme.platform.localhost`

The `.localhost` suffix is intentional. It resolves to loopback without macOS
mDNS/Bonjour and without manual `/etc/hosts` entries.

User-mode high-port equivalents:

- `https://admin.platform.localhost:8443`
- `https://demo.platform.localhost:8443`
- `https://acme.platform.localhost:8443`

Same-site dev routing:

- `/`: frontend app
- `/api/v1/*`: app API
- `/auth/v1/*`: auth API

Legacy host mapping helper:

- `pnpm dev:hosts`

This command is now a no-op kept for compatibility with older instructions.

## HTTPS Modes

Caddy is required for HTTPS proxy commands.

User-mode high-port proxy:

- `pnpm dev:https:user`
- `pnpm dev:stack:https:user`
- `pnpm dev:proxy:user`
- `pnpm dev:trust-caddy:user`

Use this when privileged port `443` is not required.

Launchd-managed root proxy:

- `pnpm dev:https:launchd`
- `pnpm dev:stack:https:launchd`
- `pnpm dev:proxy:launchd:install`
- `pnpm dev:proxy:launchd:status`

Use this when local testing needs normal HTTPS URLs on `443` and a managed Caddy daemon.

Legacy foreground root proxy:

- `pnpm dev:https`
- `pnpm dev:stack:https`
- `pnpm dev:proxy`
- `pnpm dev:trust-caddy`

Use this only when the foreground root-mode proxy is specifically needed.

## Full Stack Helpers

Frontend plus HTTPS proxy:

- `pnpm dev:https:user`
- `pnpm dev:https:launchd`
- `pnpm dev:https`

Frontend, backend APIs, and HTTPS proxy:

- `pnpm dev:stack:https:user`
- `pnpm dev:stack:https:launchd`
- `pnpm dev:stack:https`

The stack helper starts or reuses:

- frontend dev servers on `5173` and `5174`
- backend runtimes on `8080`, `8081`, and `8082`
- Caddy proxy in the selected mode

It fails on partial startup state. Stop existing listeners or start the complete matching set before rerunning.

## Stop And Cleanup

Stop known local stack listeners:

- `pnpm dev:stop`

The stop helper targets this repo's known local ports and launchd-managed Caddy.
Use `pnpm dev:stop -- --dry-run` to inspect what would be stopped.
Use `pnpm dev:stop -- --force` only when graceful shutdown fails.

## Keepawake

HTTPS session helpers hold a `caffeinate` assertion by default when available.

Disable keepawake for one command:

- `DEV_SESSION_KEEPAWAKE=0 pnpm dev:https:user`

## Boundaries

Local dev commands must not redefine app ownership.

- `platform-admin-web` remains the internal admin/backoffice app.
- `tenant-web` remains the tenant-scoped app.
- Same-site local routing must keep `/auth/v1/*` and `/api/v1/*` assumptions intact.
- Runtime app code must use runtime config and same-site paths, not hardcoded backend URLs.
- Local HTTPS and install-helper behavior do not introduce service-worker or offline-first scope.
