# Source Layout

For the active tenant app contract, read `platform/frontend/docs/modules/tenant-web.md`.

- `app`: bootstrapping, providers, routing
- `pages`: route-level pages
- `widgets`: page composition blocks
- `features`: user-facing actions and flows
- `entities`: domain entities and local models
- `shared`: local app-only helpers and config
- `offline`: local placeholder/status code only; offline-first delivery is future scope until explicitly activated

Only shared stable logic should move into `../../packages`.
