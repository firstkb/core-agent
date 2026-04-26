# Local Caddy HTTPS

This Caddy configuration is for local frontend development only.

It is not part of deployment.

## Modes

- `Caddyfile`: privileged root / launchd mode on `443`
- `Caddyfile.high-port`: user-mode Caddy on `8443`

Both modes terminate local HTTPS and keep same-site `/api/v1/*` plus `/auth/v1/*` paths for secure-cookie development.

## Domains

Root / launchd mode:

- `https://admin.platform.localhost`
- `https://demo.platform.localhost`
- `https://acme.platform.localhost`

The `.localhost` suffix avoids macOS `.local` mDNS/Bonjour stalls and resolves
to loopback without `/etc/hosts`.

User high-port mode:

- `https://admin.platform.localhost:8443`
- `https://demo.platform.localhost:8443`
- `https://acme.platform.localhost:8443`

## Backends

- `admin.platform.localhost/` -> `127.0.0.1:5173`
- `admin.platform.localhost/api/v1/*` -> `127.0.0.1:8081`
- `admin.platform.localhost/auth/v1/*` -> `127.0.0.1:8082`
- `demo.platform.localhost/` -> `127.0.0.1:5174`
- `demo.platform.localhost/api/v1/*` -> `127.0.0.1:8080`
- `demo.platform.localhost/auth/v1/*` -> `127.0.0.1:8082`
- `acme.platform.localhost/` -> `127.0.0.1:5174`
- `acme.platform.localhost/api/v1/*` -> `127.0.0.1:8080`
- `acme.platform.localhost/auth/v1/*` -> `127.0.0.1:8082`

This same-site routing exists for local development only and is intended to prepare browser auth flows for secure cookie-based refresh handling.

## Recommended Workflows

Stable `443` workflow with launchd:

1. `pnpm dev:proxy:launchd:install`
2. `pnpm dev:trust-caddy`
3. `pnpm dev:https:launchd` or `pnpm dev:stack:https:launchd`

No-sudo workflow on a high port:

1. `pnpm dev:trust-caddy:user`
2. `pnpm dev:https:user` or `pnpm dev:stack:https:user`
