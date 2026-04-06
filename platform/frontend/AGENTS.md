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
- use public entrypoints only; no deep imports
- packages must export through `src/index.ts` only
- `design-tokens`: tokens only; no React code
- `ui-kit`: reusable primitives and low-risk shared patterns
- `api-client`: HTTP client, generated clients, request helpers, and transport contracts
- `auth-core`: session model, auth state, sign-in and sign-out flows, auth guards
- `tenant-core`: tenant identity, config, branding, permissions, and runtime context
- `app-shell`: shared layout shell, navigation scaffolds, and app chrome
- `forms`: shared form primitives and helpers
- keep UI-free core packages separate from UI packages
- UI-free packages should not import `ui-kit`
- `platform-builder-core` is typed contract code, not a UI package

## Shared UI boundary

- `ui-kit` is not a staging area for every donor pattern
- promote into `ui-kit` only when the contract is product-owned, generic, reusable, and stable
- route-specific compositions, workflow wrappers, tenant-specific filters, and shell-specific chrome stay in app code until explicitly approved
- stable-approved shared primitives are safe defaults; provisional primitives may be used for review but should not have their API expanded casually

## Tenant boundary

- `tenant-core` owns reusable tenant identity, config, branding, permissions, and runtime context
- tenant-aware logic reused across apps belongs in `tenant-core`
- route-level composition, screen-specific permissions decisions, and tenant workflows stay in app code until they become real shared contracts

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

## Auth and transport rules

- use runtime config only
- use same-site `/auth/v1/*` and `/api/v1/*` paths
- do not hardcode backend URLs in app code
- do not send `tenantId` during login
- do not store or read refresh tokens in JavaScript
- auth endpoints must use `credentials: "include"`
- keep only `accessToken` and `expiresAt` in browser auth storage
- keep a single auth state owner; do not add a second auth context
- bootstrap private app state from real `/profile`, not fake timers or duplicate profile state
- derive OTP input length from backend `otp_length`; never hardcode it

## Layout defaults

- start from one-column layout
- add a second column only when the screen clearly benefits
- app shells use explicit sidebar width plus `minmax(0, 1fr)` content
- shared surfaces should prefer `min-width: 0` and `width: 100%`
- avoid `auto-fit` / `auto-fill` grids in shared shells or primitives without explicit review

## Collection-table boundary

- the current collection-table surface remains app-local until the contract is accepted and reused
- the host page owns endpoint mapping; shared table runtime must not know literal backend URLs
- row actions, selection, bulk actions, and search behavior come from explicit metadata, not column-name inference
- use shared `date-picker` for date search/filter controls

## Working rules

1. Start from the approved contract docs.
2. Reuse existing tokens, primitives, and shell rules.
3. Keep container/page logic separate from presentational pieces.
4. Cover loading, error, empty, ready, and disabled/pending states when relevant.
5. Do not treat a proving surface contract as an automatic shared-package contract.

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
