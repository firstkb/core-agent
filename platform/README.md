# Platform

`platform/` holds the product runtime surfaces.

## Current Layout

```text
platform/
  README.md
  CHANGELOG.md

  backend/
    README.md
    bin/
    bundle/
    cmd/
    docker/
    docs/
    internal/
    migrations/
    tools/

  frontend/
    AGENTS.md
    README.md
    package.json
    pnpm-workspace.yaml
    turbo.json
    tsconfig.base.json

    docs/
      README.md
      frontend-ai-agent-starter-kit.md
      package-boundaries.md
      app-surfaces.md
      tenant-model.md
      offline-strategy.md
      adr/
      architecture/

    apps/
      platform-admin-web/
      tenant-web/

    packages/
      design-tokens/
      ui-kit/
      api-client/
      auth-core/
      tenant-core/
      app-shell/
      forms/

    tooling/
      eslint/
      typescript/
      vite/
```

## Frontend Decisions

- frontend lives under `platform/frontend`, not as top-level `platform/apps` and `platform/packages`
- admin surface is `platform-admin-web`
- tenant surface is `tenant-web`
- `tenant-pwa` is intentionally deferred until offline-first becomes a separate runtime
- frontend shared packages are capability-based, not `shared-*` dumping grounds

## Frontend Docs

See `platform/frontend/docs/frontend-ai-agent-starter-kit.md` for the starter set and the ordered remaining steps.
