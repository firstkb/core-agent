# Local Caddy HTTPS

This Caddy configuration is for local frontend development only.

It is not part of deployment.

## Domains

- `https://admin.platform.local`
- `https://demo.platform.local`
- `https://acme.platform.local`

## Backends

- `admin.platform.local/` -> `127.0.0.1:5173`
- `admin.platform.local/api/v1/*` -> `127.0.0.1:8081`
- `admin.platform.local/auth/v1/*` -> `127.0.0.1:8082`
- `demo.platform.local/` -> `127.0.0.1:5174`
- `demo.platform.local/api/v1/*` -> `127.0.0.1:8080`
- `demo.platform.local/auth/v1/*` -> `127.0.0.1:8082`
- `acme.platform.local/` -> `127.0.0.1:5174`
- `acme.platform.local/api/v1/*` -> `127.0.0.1:8080`
- `acme.platform.local/auth/v1/*` -> `127.0.0.1:8082`

This same-site routing exists for local development only and is intended to prepare browser auth flows for secure cookie-based refresh handling.
