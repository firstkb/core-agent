# Current State

Status: active snapshot
Snapshot date: 2026-04-05

Confidence classes:
- `code-confirmed` = directly observed in code, config, imports, or repository tree
- `doc-confirmed` = stated in current canonical docs and treated as active contract, but not re-verified everywhere in code during this pass
- `inferred` = strong synthesis across code/docs, still an interpretation
- `planned` = intended direction, not yet implemented

## Code-confirmed platform state

### Backend

- A Go backend exists as a modular monolith under `platform/backend`.
- Active runtime entrypoints observed in code:
  - `cmd/api-admin`
  - `cmd/api-tenant`
  - `cmd/auth`
  - `cmd/migrate`
- Admin modules observed in code include navigation, profile, tenant management, module registry list, module registry management, module registry grants, and access policy.
- Tenant module currently confirmed in code:
  - `tenant/profile`
- Shared backend areas observed in code include authentication, sessions, collection-table helpers, collection preferences, audit, notifications, and forms.

### Frontend

- The frontend workspace exists under `platform/frontend` with pnpm + turbo.
- Active apps observed in code:
  - `platform-admin-web`
  - `tenant-web`
- Shared packages observed in code include:
  - `api-client`
  - `app-shell`
  - `auth-core`
  - `design-tokens`
  - `forms`
  - `i18n`
  - `install-helper`
  - `platform-builder-core`
  - `tenant-core`
  - `ui-kit`

### Cross-stack

- Collection Table is currently proven inside the admin app module-registry list page.
- FE/BE coordinated work now has an installed Atlas-based control workflow under `.agents/skills/ramp-conductor/` plus `platform/docs/ai/prompts/*`, `templates/*`, and `runs/*`.

## Doc-confirmed active contracts

### Auth and session alignment

- The active auth contract is cookie-refresh based.
- `packages/api-client` uses `credentials: "include"` for auth endpoints.
- `packages/auth-core` persists access token and expiry, not an active refresh token.
- Frontend auth follow-up docs remain a live cleanup surface, not a closed topic.

### Admin control plane

- Module Registry backend phases 1–5 are documented as completed.
- Admin navigation exists as a first-class backend contract and remains separate from profile bootstrap.
- Current non-root rollout slice is tenant onboarding.

### Schema and tenancy baseline

- The master + tenant database split is an active contract.
- Tenant bundle + forward migrations are part of the current migration model.
- Tenant-aware design retains `tenant_id`.

### Frontend foundation and builder

- Shared frontend foundation docs are extensive and active.
- Platform Builder V2 is the active reset direction for builder work.
- Collection Table is treated as its own reusable runtime/package domain; Module Registry is a proving surface, not the owner of the table contract.

## Inferred state

- Atlas should remain the single shared-memory owner for coordinated product work; FE/BE lanes should continue to propose deltas rather than finalize shared memory.
- The current workflow stack is ready for pilot usage but still early enough that prompt/template/script drift must be watched closely.

## Planned / deferred surfaces

- `cmd/worker` is described in backend target docs as a runtime surface, but is not present in code yet.
- `tenant-pwa` is a deferred documentation concept only.
- Collection Table package promotion is still a direction, not a completed extraction.

## Active workstreams

1. Auth and session alignment
2. Admin control plane hardening
3. Schema and tenancy baseline
4. Frontend foundation and Platform Builder V2
5. Collection Table packaging direction
6. Atlas-based control workflow pilot and run-artifact discipline

## Risks and hygiene

- Do not let module-registry-specific assumptions become the universal Collection Table contract.
- Keep new docs repo-relative; machine-local paths are not acceptable in active docs.
- Frontend `node_modules`, `dist`, and `.turbo` remain high-noise zones and must stay opt-in.
- Archived prompt artifacts remain historical context only.
- `platform/backend/env/Untitled` still looks stray and should stay out of canonical workflows until verified or removed.

## What to update after each major task

- update this file when active project state materially changes
- append durable decisions to `decisions-log.md`
- update the relevant module file if a boundary or contract changed

## Current recommended read targets by task

- auth/session task -> `modules/auth-and-session.md`
- admin navigation / access-policy task -> `modules/admin-control-plane.md`
- module registry task -> `modules/admin-module-registry.md`
- collection-table runtime or package-promotion task -> `modules/collection-table.md`
- migration, DB, or tenant isolation task -> `modules/schema-and-tenancy.md`
- builder task -> `modules/platform-builder-v2.md`
