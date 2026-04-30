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

- `platform/backend/AGENTS.md` now points agents at `maestro/memory` first. Former `platform/docs/ai` memory was migrated and deleted; old text is git-history provenance only.
- Some older backend guidance mentions legacy-compatible prefixed tenant business tables. Newer schema contracts make canonical snake_case the runtime target and keep legacy naming as import/reference material only.
- The backend runtime slice now stores current runtime shape in `platform/backend/docs/modules/runtime.md` and runtime wiring in `platform/backend/docs/contracts/runtime-wiring.md`.
- `backend-current-to-target-map.md` was deleted after compaction. Current memory treats `cmd/worker` as future/deferred, not an active entrypoint.
- The schema/tenancy slice now stores current schema and migration behavior in `platform/backend/docs/contracts/schema-tenancy.md` and `platform/backend/docs/contracts/migrations.md`.
- The old migration baseline said only `000_tenant_baseline.sql` was active, but code now has tenant migrations `001..006`; the new migrations contract is the current source for active migration set.
- `runbooks/local-bootstrap.md` now clarifies that local seed rows do not make master user mirroring the auth source of truth. Verify current seed/code behavior before changing auth.
- The old backend auth cookie migration plan is migration history, not current behavior. Current compact memory says refresh is cookie-backed and access token state is frontend runtime state. Exact old plan text is git-history only.
- The backend auth slice now stores current auth gateway behavior in `platform/backend/docs/contracts/auth-gateway.md`, auth schema in `platform/backend/docs/contracts/auth-control-schema.md`, and auth module behavior in `platform/backend/docs/modules/auth.md`.
- The admin control-plane slice now stores current admin access behavior in `platform/backend/docs/contracts/admin-control-plane.md` and Module Registry behavior in `platform/backend/docs/contracts/admin-module-registry.md`.
- The Collection Table slice now stores backend DTO/helper/preference and endpoint-family behavior in `platform/backend/docs/contracts/collection-table.md`.
- The backend Form Builder slice now stores backend-owned API/storage/runtime apply truth in `platform/backend/docs/contracts/platform-studio-form-builder.md` and implementation orientation in `platform/backend/docs/modules/platform-studio/form-builder.md`.
- Old frontend backend-facing Form Builder pointer docs were deleted. Older `publishBuilderDraft` lifecycle wording and `vw_ps_*` storage examples are superseded by current save/runtime-apply and `vw_`/`vg_` naming.
- `backend-admin-module-registry-brief.md` was deleted after compaction. Use compact admin memory and active admin contracts for the current state.
- `proposals/kms-signing.md` documents planned KMS work. KMS signing must not be assumed live.
- `proposals/events-mails-cleanup.md` and `proposals/schema-drift-checks.md` are future proposal scope, not active runtime behavior.
- `contracts/events-identity.md` is the active event actor identity contract.
- `archive/postgres-archive/**` contains legacy PostgreSQL SQL reference only. Do not read it as current schema or active migration input.
- Active backend docs now route `Read with`/`Read Order` through target folders. Old root-path compatibility/archive pointer docs were deleted.
- No machine-local absolute markdown links are currently observed in active `platform/backend/docs/**/*.md`. Do not reintroduce them in tracked backend docs or memory.

## Migrated Runtime Slice

Tracked docs:

- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/modules/runtime.md`

Observed state:

- The old root runtime pointer docs were deleted after compaction.
- The active tracked runtime contract is contract-first.

Current read rule:

- Prefer `contracts/runtime-wiring.md` for composition and wiring rules.
- Prefer `modules/runtime.md` for active runtime shape and backend foundation boundaries.
- Use git history only for exact old root runtime text.

## Migrated Auth Slice

Tracked docs:

- `platform/backend/docs/contracts/auth-gateway.md`
- `platform/backend/docs/contracts/auth-control-schema.md`
- `platform/backend/docs/modules/auth.md`

Observed state:

- The old root/backend auth pointer docs were deleted after compaction.
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

- Old schema baseline pointer docs were deleted after compaction.
- Active tenant migrations include `000..006`, not only the baseline.

Current read rule:

- Prefer `contracts/schema-tenancy.md` for master/tenant placement, canonical naming, tenant isolation, and import boundary.
- Prefer `contracts/migrations.md` for active master/tenant migrations, bundle rules, and `cmd/migrate` ownership.

## Migrated Admin Control-Plane Slice

Tracked docs:

- `platform/backend/docs/contracts/admin-control-plane.md`
- `platform/backend/docs/contracts/admin-module-registry.md`

Observed state:

- Old admin Module Registry and access-policy pointer docs were deleted after compaction.
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
- Old frontend backend handoff/storage/review pointer docs were deleted after compaction and are not active backend contracts.
- The old `publishBuilderDraft` lifecycle is superseded by authoring save plus additive runtime apply.
- Old `vw_ps_*` storage examples are superseded by current `vw_` canonical view and `vg_` grid view naming.

Current read rule:

- Prefer `contracts/platform-studio-form-builder.md` for backend Form Builder implementation work.
- Prefer `modules/platform-studio/form-builder.md` for backend implementation orientation and code-surface mapping.
- Read it with `platform/frontend/docs/modules/platform-studio/form-builder.md` for cross-stack Form Builder behavior.
- Use git history only for exact old frontend backend-facing text.

## Migrated Backend Runbooks, Proposals, And Reference Slice

Tracked docs:

- `platform/backend/docs/runbooks/local-bootstrap.md`
- `platform/backend/docs/runbooks/auth-key-sources.md`
- `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- `platform/backend/docs/proposals/kms-signing.md`
- `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`
- `platform/backend/docs/proposals/api-gateway-proxy-routing.md`
- `platform/backend/docs/proposals/events-mails-cleanup.md`
- `platform/backend/docs/proposals/schema-drift-checks.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`
- `platform/backend/docs/contracts/events-identity.md`
- `platform/backend/README.md`
- `platform/backend/docs/archive/postgres-archive/README.md`

Observed state:

- Old root/auth pointer paths for these docs were deleted after compaction.
- Operational docs moved under `runbooks/`.
- Gateway and KMS work moved under `proposals/`.
- Events/mail cleanup and schema drift verification moved under `proposals/`.
- Legacy import mapping and import module boundary moved under `reference/`.
- Event actor identity moved under `contracts/`.
- Historical plans, prompts, and old standards moved under `archive/`.
- Legacy PostgreSQL SQL moved behind `archive/postgres-archive/README.md`; the old `legacy/postgres-archive/README.md` path is a pointer.

Current read rule:

- Prefer runbooks for local operations and key/DB secret setup.
- Prefer proposals only when the owner activates gateway, KMS, events/mail cleanup, or schema drift work.
- Prefer reference docs only for import/migration archaeology; runtime schema truth remains `contracts/schema-tenancy.md`.
- Prefer `archive/postgres-archive/README.md` before opening any legacy PostgreSQL SQL payload.
- Treat deleted old root-path docs as git-history provenance only, not active ownership docs.
- Prefer `contracts/events-identity.md` for event actor identity work.
- Prefer `archive/README.md` before opening historical backend standards, prompts, or completed plans.

## Resolution Policy

- If a tracked backend doc conflicts with compact memory, first verify against code and the newer accepted tracked contract.
- If a plan says work is future but code proves it landed, update compact module `state.md` and record the stale tracked doc here.
- If a tracked doc is useful only for history, list it in `maestro/memory/docs/backend/archive/archive-candidates.md` rather than keeping it in the hot read path.
- Do not move or delete tracked backend docs during memory compaction unless that is the explicit task.
