# Frontend AI-Agent Starter Kit

This document defines the initial frontend workspace shape for AI-agent driven development.

## Canonical Decisions

- Workspace root: `platform/frontend`
- Admin app name: `platform-admin-web`
- Tenant app name: `tenant-web`
- `tenant-pwa` is deferred until offline-first becomes a separate runtime or release track
- No `shared-utils`
- No `shared-types`
- No frontend package named `research-avatar-service`

## Starter Kit Included Now

### Apps

- `apps/platform-admin-web`
- `apps/tenant-web`

### Shared Packages

- `packages/design-tokens`
- `packages/ui-kit`
- `packages/api-client`
- `packages/auth-core`
- `packages/tenant-core`
- `packages/app-shell`
- `packages/forms`

### Tooling

- `tooling/eslint`
- `tooling/typescript`
- `tooling/vite`

## Package Creation Rule

Create a shared package only when:

- the code is used by at least two apps;
- the API is stable enough to document;
- the package has a clear owner and boundary;
- the package can be consumed only through its public entrypoint.

Otherwise, keep the code inside the app.

## Ordered Next Steps

1. Pick the app runtime per surface.
   - Default recommendation: React + Vite for both apps unless SSR is a hard requirement.
2. Add repo-wide lint, test, and typecheck configs under `tooling/`.
3. Implement `design-tokens` first, then `ui-kit`.
4. Implement `tenant-core` before auth and routing logic spread across apps.
5. Generate or hand-build `api-client` after backend contract shape is stable enough.
6. Keep offline support under `apps/tenant-web/src/offline` until the product proves it needs a distinct app or package.
7. Add CI only after basic `build`, `lint`, `test`, and `typecheck` scripts are executable in both apps.

## Local Development Hosts

- `admin.platform.local:5173` -> `apps/platform-admin-web`
- `demo.platform.local:5174` -> `apps/tenant-web`

These hostnames require matching `/etc/hosts` entries on the local machine.

Recommended entry:

```text
127.0.0.1 admin.platform.local demo.platform.local
```

## Local HTTPS Proxy

Use Caddy only for local development.

- config: `dev/caddy/Caddyfile`
- host setup: `pnpm dev:hosts`
- trust local CA: `pnpm dev:trust-caddy`
- run apps plus HTTPS proxy: `pnpm dev:https`
- run only the HTTPS proxy against already-running apps: `pnpm dev:proxy`

Target URLs:

- `https://admin.platform.local`
- `https://demo.platform.local`

This does not participate in deployment.

## What To Avoid Early

- publishing too many packages before reuse exists;
- app-to-app imports;
- package deep imports;
- mixing UI primitives into core packages;
- turning docs into stale architecture fiction.

## Minimum Definition Of Ready

Before feature implementation starts, each app and package should have:

- a short `README.md`;
- a `package.json`;
- a single public entrypoint;
- a clear dependency direction.
