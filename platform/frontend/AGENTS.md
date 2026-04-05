# Frontend Workspace Guidance

Scope: `platform/frontend` only.

Read first:

1. `platform/AGENTS.md`
2. `platform/docs/ai/README.md`
3. `platform/docs/ai/current-state.md`
4. relevant module docs under `platform/docs/ai/modules/`
5. `platform/frontend/docs/README.md`

## Lane orchestration rule

During the v1 pilot, the preferred entrypoint for new frontend work is `Atlas` (`$ramp-conductor`).
Atlas may route the task to:
- direct frontend no-run work
- `FE_ONLY` run-backed work
- cross-stack coordinated work

Use this lane directly only when:
- the task is obviously tiny and frontend-local
- or Atlas already issued a frontend packet

## Canonical app surfaces

- `platform-admin-web`: internal platform/backoffice interface
- `tenant-web`: tenant-scoped application surface
- `tenant-pwa`: deferred until offline becomes a distinct runtime concern

## Package rules

- create a package only when reuse is real and the API is stable
- do not create `shared-utils` or `shared-types` dumping grounds
- apps may import packages; packages must not import apps
- use public entrypoints only
- keep UI-free core packages separate from UI packages
- `platform-builder-core` is typed contract code, not a UI package

## Default ignore set

Do not read by default:

- `**/node_modules/**`
- `**/dist/**`
- `**/.turbo/**`
- `docs/vendor/**`
- `docs/platform-builder-v2/old-code-reference/**`
- archived prompts under `platform/docs/archive/**`

## High-risk areas

Require extra care before finalizing changes that affect:

- auth/session bootstrap
- route guards
- same-site auth/api path assumptions
- admin vs tenant route separation
- shared package boundaries
- design token or shell-wide changes

## Working rules

1. Start from the approved contract docs.
2. Reuse existing tokens, primitives, and shell rules.
3. Keep container/page logic separate from presentational pieces.
4. Cover loading, error, empty, ready, and disabled/pending states when relevant.
5. Do not hardcode backend URLs; use runtime config.
6. Do not send tenant identity during login.
7. Do not treat a proving surface contract as an automatic shared-package contract.

## Commands

Workspace:

- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

Targeted apps:

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

Local runtime helpers:

- `pnpm dev`
- `pnpm dev:https`
- `pnpm dev:stack:https`
- `pnpm dev:proxy`

## Docs update rule

Update docs when code changes any of these:

- auth bootstrap or refresh behavior
- collection-table runtime contract or package-promotion boundary
- admin module-registry proving-surface contract
- admin navigation contract
- package boundary rules
- Platform Builder V2 route or boundary model
- shell/title/navigation behavior that affects more than one surface

## Summary format

- Goal
- Route / feature
- Changed files
- Shared packages reused
- New shared primitives/tokens added
- States covered
- Commands run
- Risks / follow-ups
