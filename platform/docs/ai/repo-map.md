# Platform Repo Map

Status: active
Date: 2026-04-05

## Product root

```text
platform/
  AGENTS.md
  README.md
  CHANGELOG.md

  docs/
    ai/
      prompts/
      templates/
      runs/
      modules/
    archive/

  backend/
  frontend/
```

## AI operating layer

```text
.agents/
  skills/
    ramp-conductor/
      SKILL.md
      agents/openai.yaml
```

Display name for `ramp-conductor` is `Atlas`.
Invocation stays explicit:

- `$ramp-conductor`

## Backend map

```text
platform/backend/
  AGENTS.md
  README.md
  CHANGELOG.md
  api.Taskfile.yml
  env/
  scripts/
  docs/
  bundle/
  migrations/
  seeds/

  cmd/
    api-admin/
    api-tenant/
    auth/
    migrate/

  internal/platform/
    appenv/
    appinfo/
    auth/
    config/
    hosting/
    httpx/
    logging/
    notify/
    options/
    postgres/
    tenant/

  modules/
    admin/
      accesspolicy/
      moduleregistrygrants/
      moduleregistrylist/
      moduleregistrymanage/
      navigation/
      profile/
      tenantmanagement/

    tenant/
      profile/

    shared/
      audit/
      authentication/
      collectionprefs/
      collectiontable/
      forms/
      identity/
      notifications/
      sessions/
```

### Backend runtime summary

- `cmd/api-admin`: control-plane admin API
- `cmd/api-tenant`: tenant-scoped application API
- `cmd/auth`: OTP auth, JWKS, refresh/logout
- `cmd/migrate`: master + tenant migration runtime

Planned in docs but not present as a runtime yet:

- `cmd/worker`

## Frontend map

```text
platform/frontend/
  AGENTS.md
  README.md
  package.json
  pnpm-workspace.yaml
  turbo.json
  docs/
  scripts/
  dev/
  tooling/

  apps/
    platform-admin-web/
    tenant-web/

  packages/
    api-client/
    app-shell/
    auth-core/
    design-tokens/
    forms/
    i18n/
    install-helper/
    platform-studio-core/
    tenant-core/
    ui-kit/
```

### Frontend runtime summary

- `apps/platform-admin-web`: platform/backoffice UI
- `apps/tenant-web`: tenant-facing UI

Deferred surface in docs, not present as an app:

- `tenant-pwa`

### Important frontend feature zones

- admin navigation and module registry list/edit flows in `platform-admin-web`
- Platform Studio scaffold in `tenant-web`
- published-app runtime in `tenant-web`
- shared transport in `packages/api-client`
- shared auth state in `packages/auth-core`
- shared tenant context in `packages/tenant-core`
- shared shell/layout in `packages/app-shell`
- shared typed builder contracts in `packages/platform-studio-core`

## High-noise directories to ignore by default

- `platform/frontend/**/node_modules/**`
- `platform/frontend/**/dist/**`
- `platform/frontend/**/.turbo/**`
- `platform/frontend/docs/vendor/**`
- `platform/frontend/docs/platform-studio/old-code-reference/**`
- `platform/backend/docs/legacy/**`
- `platform/backend/migrations/postgres/archive/**`
- `platform/docs/archive/**`
