# Source Layout

- `app`: bootstrapping, providers, routing
- `pages`: route-level pages
- `widgets`: page composition blocks
- `features`: user-facing actions and flows
- `entities`: domain entities and local models
- `shared`: local app-only helpers and config
- `offline`: offline-first capability kept inside the app until it stabilizes

Only shared stable logic should move into `../../packages`.
