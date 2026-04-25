# Backend Docs Drift Report

Status: local drift report
Last audited: 2026-04-25

This report records known friction in `platform/backend/docs`.
Use it before treating older backend docs as active runtime truth.

## Stable Decisions

- The active backend runtime entrypoints are `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, and `cmd/migrate`.
- `cmd/migrate` owns schema changes and tenant bundle generation.
- `scapi` is retired and must not be recreated as an active target.
- Cognito is not the backend auth target; the target is backend-issued JWT plus JWKS and gateway validation.
- Master DB owns control-plane data; tenant DBs own tenant application data.
- Tenant runtime scope must come from trusted context, not from user-supplied tenant identifiers.
- Runtime tenant schema is canonical PostgreSQL snake_case; legacy names are import/reference concerns.
- Backend Collection Table shared helpers live under `platform/backend/modules/shared/collectiontable` and `platform/backend/modules/shared/collectionprefs`.

## Known Drift

- `platform/backend/AGENTS.md` still points agents at the old `platform/docs/ai` and Atlas/ramp-conductor style read order. For current local AI work, use root `AGENTS.md` plus `ai-memory` retrieval first.
- Some older backend guidance mentions legacy-compatible prefixed tenant business tables. Newer schema contracts make canonical snake_case the runtime target and keep legacy naming as import/reference material only.
- The backend runtime slice now stores current runtime shape in `platform/backend/docs/modules/runtime.md` and runtime wiring in `platform/backend/docs/contracts/runtime-wiring.md`.
- `backend-current-to-target-map.md` is now a compatibility pointer. Current memory treats `cmd/worker` as future/deferred, not an active entrypoint.
- The schema/tenancy slice now stores current schema and migration behavior in `platform/backend/docs/contracts/schema-tenancy.md` and `platform/backend/docs/contracts/migrations.md`.
- The old migration baseline said only `000_tenant_baseline.sql` was active, but code now has tenant migrations `001..006`; the new migrations contract is the current source for active migration set.
- `local-backend-bootstrap.md` describes seed rows needed for OTP auth in wording that may imply an identity mirror. Auth boundary docs say auth correctness must not depend on a master user mirror. Verify current seed/code behavior before changing auth.
- `backend-auth-cookie-migration-plan.md` is a migration plan, not current behavior by itself. Current compact memory says refresh is cookie-backed and access token state is frontend runtime state.
- The backend auth slice now stores current auth gateway behavior in `platform/backend/docs/contracts/auth-gateway.md`, auth schema in `platform/backend/docs/contracts/auth-control-schema.md`, and auth module behavior in `platform/backend/docs/modules/auth.md`.
- The admin control-plane slice now stores current admin access behavior in `platform/backend/docs/contracts/admin-control-plane.md` and Module Registry behavior in `platform/backend/docs/contracts/admin-module-registry.md`.
- The Collection Table slice now stores backend DTO/helper/preference and endpoint-family behavior in `platform/backend/docs/contracts/collection-table.md`.
- The backend Form Builder slice now stores backend-owned API/storage/runtime apply truth in `platform/backend/docs/contracts/platform-studio-form-builder.md` and implementation orientation in `platform/backend/docs/modules/platform-studio/form-builder.md`.
- Old frontend backend-facing Form Builder docs are compatibility pointers. Older `publishBuilderDraft` lifecycle wording and `vw_ps_*` storage examples are superseded by current save/runtime-apply and `vw_`/`vg_` naming.
- `backend-admin-module-registry-brief.md` is still labeled as a planning brief while much of the listed work is already landed. Use compact admin memory for the current state.
- `auth/auth-kms-implementation-status.md` documents planned KMS work. KMS signing must not be assumed live.
- Several tracked backend docs contain machine-local markdown links. Do not copy those links into compact memory; repair them during the later physical docs rewrite.

## Migrated Runtime Slice

Tracked docs:

- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/modules/runtime.md`

Observed state:

- The old root runtime docs are now compatibility pointers.
- The active tracked runtime contract is contract-first.

Current read rule:

- Prefer `contracts/runtime-wiring.md` for composition and wiring rules.
- Prefer `modules/runtime.md` for active runtime shape and backend foundation boundaries.
- Use old root runtime paths only for compatibility with existing links.

## Migrated Auth Slice

Tracked docs:

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`

Observed state:

- The old root backend auth docs are now compatibility pointers.
- The active tracked backend auth contract is contract-first.

Current read rule:

- Prefer `contracts/auth-gateway.md` for JWT/JWKS/cookie/gateway behavior.
- Prefer `contracts/auth-control-schema.md` for master auth tables and tenant user requirements.
- Prefer `modules/auth.md` for tenant resolution, OTP, refresh/logout, and profile boundary.

## Migrated Schema And Tenancy Slice

Tracked docs:

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`

Observed state:

- Old schema baseline docs are now compatibility pointers.
- Active tenant migrations include `000..006`, not only the baseline.

Current read rule:

- Prefer `contracts/schema-tenancy.md` for master/tenant placement, canonical naming, tenant isolation, and import boundary.
- Prefer `contracts/migrations.md` for active master/tenant migrations, bundle rules, and `cmd/migrate` ownership.

## Migrated Admin Control-Plane Slice

Tracked docs:

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

Observed state:

- Old admin Module Registry and access-policy docs are now compatibility pointers.
- Active admin contracts no longer expose the phase-heavy planning brief as the default read.

Current read rule:

- Prefer `contracts/admin-control-plane.md` for root/non-root behavior, grants, navigation, and route authorization.
- Prefer `contracts/admin-module-registry.md` for Module Registry list/manage/grants and section catalog behavior.

## Migrated Collection Table Slice

Tracked docs:

- `platform/backend/docs/contracts/collection-table.md`

Observed state:

- Backend Collection Table behavior now has a dedicated active contract.
- Module Registry, Employees, and Tenant List are consumers, not owners of the generic contract.

Current read rule:

- Prefer `contracts/collection-table.md` for backend shared DTOs, validators, preferences, and collection endpoint families.
- Read it with `platform/frontend/docs/contracts/collection-table.md` for cross-stack table work.

## Migrated Platform Studio Form Builder Slice

Tracked docs:

- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

Observed state:

- Backend-owned Form Builder API, storage, validation, generated objects, and runtime apply now have a dedicated active backend contract.
- Old frontend backend handoff/storage/review docs are compatibility pointers, not active backend contracts.
- The old `publishBuilderDraft` lifecycle is superseded by authoring save plus additive runtime apply.
- Old `vw_ps_*` storage examples are superseded by current `vw_` canonical view and `vg_` grid view naming.

Current read rule:

- Prefer `contracts/platform-studio-form-builder.md` for backend Form Builder implementation work.
- Prefer `modules/platform-studio/form-builder.md` for backend implementation orientation and code-surface mapping.
- Read it with `platform/frontend/docs/modules/platform-studio/form-builder.md` for cross-stack Form Builder behavior.
- Use old frontend backend-facing docs only for historical audit detail.

## Resolution Policy

- If a tracked backend doc conflicts with compact memory, first verify against code and the newer accepted tracked contract.
- If a plan says work is future but code proves it landed, update compact module `state.md` and record the stale tracked doc here.
- If a tracked doc is useful only for history, list it in `ai-memory/docs/backend/archive/archive-candidates.md` rather than keeping it in the hot read path.
- Do not move or delete tracked backend docs during memory compaction unless that is the explicit task.
