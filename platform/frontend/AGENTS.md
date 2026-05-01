# Frontend Workspace Guidance

Scope: `platform/frontend` only.

Responsibility: frontend implementation rules only: app/package boundaries,
frontend auth/transport constraints, layout/code guardrails, commands, tests,
and frontend docs update expectations. Maestro runtime owns UI/UX judgment,
browser/desktop evidence policy, agent/tool selection, artifacts, and closeout
behavior.

Read first:

1. `platform/AGENTS.md`
2. `maestro/memory/START_HERE.md`
3. `maestro/memory/index/read-routes.yaml`
4. relevant module pack under `maestro/memory/modules/**`
5. `platform/frontend/docs/README.md`

Use `maestro/memory/index/memory-index.yaml` only when broader routing is needed.

## Orchestration rule

For new frontend work, the preferred entrypoint is Maestro when the task is
ambiguous, cross-stack, UI-visible enough to need evidence, or likely to need
durable memory. Tiny frontend-local edits may stay direct in the current chat.

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
- `platform-studio-core` is typed contract code, not a UI package

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
- `docs/platform-studio/old-code-reference/**`
- deleted legacy AI memory path `../docs/ai/**`; use `maestro/memory/durable/legacy-memory-import.md` and git history only for explicit historical reconstruction
- archived prompts under `platform/**`

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

## File size guardrails

- Treat line counts as maintainability heuristics, not hard CI limits.
- Prefer UI components, panels, dialogs, and focused helpers under roughly 300 lines.
- Keep route/page files orchestration-focused; if they exceed roughly 500-700 lines, propose presentational component or controller/helper extraction before adding non-trivial UI.
- State/runtime files may be larger only when cohesive and covered by tests; if they exceed roughly 1000-1200 lines, propose reducer/selectors/actions/test-fixture split.
- Do not grow already large UI monoliths for new feature work without first considering a small decomposition slice.

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
- `pnpm storybook`
- `pnpm storybook:build`

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
- `pnpm dev:https:launchd`
- `pnpm dev:stack:https:launchd`
- `pnpm dev:proxy:launchd:install`
- `pnpm dev:proxy:launchd:status`
- `pnpm dev:https:user`
- `pnpm dev:stack:https:user`
- `pnpm dev:proxy:user`
- `pnpm dev:stop`

## Docs update rule

Update docs when code changes any of these:

- auth bootstrap or refresh behavior
- collection-table runtime contract or package-promotion boundary
- admin module-registry proving-surface contract
- admin navigation contract
- package boundary rules
- Platform Studio route or boundary model
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
