# Current State

Status: compact active snapshot
Last compacted: 2026-04-25

This is a compact AI retrieval snapshot.
Use canonical docs and code for final verification before changing behavior.

Confidence labels:

- `code-confirmed`: directly observed in repository code/config/tree.
- `doc-confirmed`: stated in tracked canonical docs and treated as active unless code disproves it.
- `owner-confirmed`: clarified directly by the repository owner during memory maintenance.
- `inferred`: synthesis across observed sources.

## Repository Runtime

- `landed` `doc-confirmed`: The repository has a Codex-native runtime model rooted in `AGENTS.md`, `.agents/skills/`, `.codex/`, `.agent-cli/`, `docs/codex-native-repo.md`, and `docs/maestro/module-orchestrator-v2-spec-pack/`.
- `landed` `doc-confirmed`: Stable system agent ids are `module_orchestrator`, `research_codebase`, and `brief_auditor`.
- `landed` `doc-confirmed`: Stable skill nicknames are `maestro`, `charlie`, and `grant`.
- `landed` `doc-confirmed`: Persisted module/feature/stage artifacts live under `artifacts/` and are runtime artifacts, not design-time source of truth.
- `landed` `doc-confirmed`: `.agent-cli/` owns typed lifecycle state transitions and mutable JSON status files.
- `landed` `doc-confirmed`: Atlas/ramp-conductor platform workflow now reads `ai-memory` first, uses active operational files under `ai-memory/atlas`, and writes new run artifacts to `ai-memory/runs/active`.

## Product Runtime

- `landed` `code-confirmed`: Product code lives under `platform/`.
- `landed` `code-confirmed`: Backend runtime entrypoints include `cmd/api-admin`, `cmd/api-tenant`, `cmd/auth`, and `cmd/migrate`.
- `planned` `doc-confirmed`: `cmd/worker` is still future/deferred and should not be treated as present.
- `landed` `code-confirmed`: Backend modules exist under `platform/backend/modules/admin`, `platform/backend/modules/tenant`, and `platform/backend/modules/shared`.
- `landed` `code-confirmed`: Frontend apps are `platform-admin-web` and `tenant-web`.
- `landed` `code-confirmed`: `platform-admin-web` loads `/app/profile` before `/app/me/navigation` and builds admin sidebar/favorites from backend navigation.
- `landed` `doc-confirmed`: `tenant-web` shell/auth/bootstrap, Platform Studio ownership, tenant-core boundary, install-helper placement, and future PWA/mobile exclusions now live at `platform/frontend/docs/modules/tenant-web.md`.
- `landed` `owner-confirmed`: Current applications are online web applications.
- `planned` `owner-confirmed`: Offline PWA and Flutter/hybrid mobile are future delivery layers after the main web platform stabilizes.
- `planned` `doc-confirmed`: `tenant-pwa` is deferred and not a current app.
- `landed` `code-confirmed`: Frontend shared packages include `api-client`, `app-shell`, `auth-core`, `collection-table`, `design-tokens`, `forms`, `i18n`, `install-helper`, `platform-studio-core`, `tenant-core`, and `ui-kit`.
- `landed` `doc-confirmed`: Current install prompt/runtime behavior lives at `platform/frontend/docs/guides/install-helper.md`; it is mounted on public auth screens and does not imply offline-first or service-worker scope.
- `landed` `doc-confirmed`: Frontend local dev commands, HTTPS proxy modes, ports, domains, and checks live at `platform/frontend/docs/guides/local-dev.md`.
- `landed` `doc-confirmed`: Active frontend docs now use target-folder `Read with`/`Read Order` links; old root and `platform-studio/**` docs are compatibility, exact-detail, archive, or reference-only inputs.
- `landed` `doc-confirmed`: UI Kit governance, stable/provisional approval, layout baseline, and delivery order now live at `platform/frontend/docs/contracts/ui-kit.md`.
- `landed` `doc-confirmed`: UI Lab route, section model, review coverage, and editing rules now live at `platform/frontend/docs/guides/ui-lab.md`.
- `landed` `doc-confirmed`: The frontend foundation rollout and Phase E gap review are closed history; durable lessons are compacted into the UI Kit contract and UI Lab guide.
- `planned` `doc-confirmed`: Deferred composed UI surfaces such as remote table workspaces, file uploads, AI assistant dialog, messenger, and kanban remain future/app-layer-first proposal scope at `platform/frontend/docs/proposals/deferred-composed-surfaces.md`.
- `landed` `owner-confirmed`: Reference-code packs use stable `reference-pack:*` aliases in `docs/ref/reference-code.md`; raw donor/legacy packs moved out of active FE/BE docs into local `reference-code/` raw-pack storage.
- `landed` `doc-confirmed`: The reference-code relocation checkpoint is recorded in `ai-memory/reference-code/relocation-checkpoint.md`; old raw-pack tracked paths contain pointer READMEs only.
- `landed` `doc-confirmed`: `docs/ref/` now contains only stable opt-in reference registry docs; memory-reorganization brainstorms moved to `docs/archive/memory-reorg/`.
- `landed` `doc-confirmed`: `platform/docs/ai/README.md`, prompt README, template README, and run README are retired pointers. Active Atlas workflow lives under `ai-memory/atlas/**`.

## Active Product Domains

- `landed` `doc-confirmed`: Auth/session uses cookie-backed HttpOnly refresh tokens; frontend stores access token and expiry, not an active refresh token.
- `landed` `doc-confirmed`: Admin navigation is separate from profile bootstrap; `/app/profile` is profile-only and `GET /app/me/navigation` owns admin navigation.
- `landed` `doc-confirmed`: Multi-tenant isolation is non-negotiable; tenant scope must come from trusted runtime context.
- `landed` `code-confirmed`: Collection Table exists as `@platform/collection-table` and is consumed by Module Registry, Employees, and Tenants in the admin app.
- `planned` `doc-confirmed`: Collection Table still needs shared optional support for XLS export, row action `view`, and row action `pdf`.
- `landed` `owner-confirmed`: Platform Studio is the tenant-web suite of builder/configuration tools for forms, navigation/sidebar, access-facing runtime exposure, actions/events, PDFs, reports, and related future tools.
- `landed` `doc-confirmed`: Platform Studio suite-level tracked docs now live at `platform/frontend/docs/contracts/platform-studio.md` and `platform/frontend/docs/modules/platform-studio/README.md`.
- `landed` `doc-confirmed`: Active Form Builder tracked behavior now lives at `platform/frontend/docs/modules/platform-studio/form-builder.md`.
- `landed` `doc-confirmed`: Form Builder field catalog, palette registry, rules, grid/view settings, and scope boundaries now live at `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` as a supporting frontend contract.
- `landed` `doc-confirmed`: Old Form Builder detail/workstream docs are classified in `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md` as compatibility pointers, exact-detail references, future proposals, archive candidates, or reference-only donor material.
- `landed` `doc-confirmed`: Old Form Builder archive/future workstream docs were rewritten in place as short pointer stubs; exact-detail reference docs remain intact for payload/settings audit.
- `landed` `doc-confirmed`: Retained old Form Builder exact-detail docs now declare `Status: exact detail reference` and point readers back to the active Form Builder module docs first.
- `landed` `doc-confirmed`: Backend-owned Form Builder API, storage, validation, generated-object, and runtime apply behavior now lives at `platform/backend/docs/contracts/platform-studio-form-builder.md`.
- `landed` `doc-confirmed`: Backend Form Builder implementation orientation now lives at `platform/backend/docs/modules/platform-studio/form-builder.md`.
- `landed` `doc-confirmed`: Backend operational docs now use `platform/backend/docs/runbooks/` for local bootstrap, auth key sources, and DB instance secret resolution.
- `landed` `doc-confirmed`: Backend gateway and KMS work now lives under `platform/backend/docs/proposals/` and remains inactive until owner activation.
- `landed` `doc-confirmed`: Backend legacy import mapping and import module boundary now live under `platform/backend/docs/reference/`; runtime schema truth remains `contracts/schema-tenancy.md`.
- `landed` `doc-confirmed`: Backend event actor identity now lives at `platform/backend/docs/contracts/events-identity.md`.
- `landed` `doc-confirmed`: Backend events/mail cleanup and schema drift checks now live under `platform/backend/docs/proposals/` and remain inactive until owner activation.
- `landed` `doc-confirmed`: Old backend standards, completed plans, and prompt artifacts now live under `platform/backend/docs/archive/`; old root paths are archive pointers.
- `landed` `doc-confirmed`: Legacy PostgreSQL SQL now lives behind `platform/backend/docs/archive/postgres-archive/README.md`; `platform/backend/docs/legacy/postgres-archive/README.md` is only a compatibility pointer.
- `landed` `doc-confirmed`: Active backend docs now use target-folder `Read with`/`Read Order` links; old root docs are compatibility pointers only.
- `landed` `doc-confirmed`: `ai-memory/index/*` no longer lists old FE/BE root docs or `platform/docs/ai/**` as active ownership routes; old platform memory is historical import material only.
- `landed` `doc-confirmed`: Form Builder is the active Platform Studio tool.
- `planned` `owner-confirmed`: Navigation Builder, Action Builder, PDF Builder, and Report Builder are planned Platform Studio tools, not implementation-active.
- `planned` `owner-confirmed`: Navigation Builder is expected to include sidebar/navigation composition and may include access/permission assignment unless a later decision splits access into a dedicated tool.
- `landed` `doc-confirmed`: Form Builder uses a three-schema split: model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`.
- `landed` `doc-confirmed`: Form Builder authoring transport uses canonical `/authoring`; `/draft` remains a temporary compatibility alias only.
- `landed` `doc-confirmed`: Form Builder `Save` is authoring persistence plus additive runtime apply, not site publication.
- `planned` `doc-confirmed`: Runtime ACL through Navigation Builder is not fully implemented; current runtime route split is preparatory and should not invent temporary grants.

## Current Risks

- `risk` `doc-confirmed`: Old platform memory under `platform/docs/ai` and new Codex-native runtime docs can be confused. Use `ai-memory` as retrieval and verify against owner surfaces.
- `risk` `doc-confirmed`: Some tracked docs still contain machine-local absolute links and stale statuses.
- `risk` `doc-confirmed`: Some old frontend tracked docs contain stale lifecycle/extraction status, especially compatibility pointers and older auth follow-up state. Use `ai-memory/docs/frontend/drift-report.md` before treating them as current truth.
- `risk` `doc-confirmed`: Some backend tracked docs are working plans, proposed gateway policies, historical standards, or older agent instructions. Use `ai-memory/docs/backend/drift-report.md` before treating them as current truth.
- `risk` `doc-confirmed`: Closed or superseded legacy run artifacts still live under `platform/docs/ai/runs`; they are provenance only after the Atlas operational cutover.
- `risk` `doc-confirmed`: Detailed Platform Studio field/backend/supporting docs remain large. Read the suite contract, module entrypoint, and Form Builder module contract first, then only the exact supporting detail doc needed.
- `risk` `doc-confirmed`: Old Form Builder archive/future workstream paths are pointer stubs. Use git history only for exact historical content, not as the active read path.
- `risk` `doc-confirmed`: Old Form Builder exact-detail docs preserve historical payload/settings details and can still be large. Use them only after compact tracked docs are insufficient.
- `risk` `doc-confirmed`: Old frontend backend-facing Form Builder docs are compatibility pointers; backend implementation work should read the backend Form Builder contract before old handoff/storage/review docs.
- `risk` `doc-confirmed`: Frontend old root/platform-studio docs still exist for compatibility and exact detail. Do not treat them as active ownership when a target-folder doc exists.
- `risk` `owner-confirmed`: Planned Platform Studio tool concerns can be accidentally implemented inside Form Builder unless the tool boundary is read first.
- `risk` `doc-confirmed`: Collection Table old root docs are compatibility pointers; prefer `platform/frontend/docs/contracts/collection-table.md` and `platform/backend/docs/contracts/collection-table.md`.
- `risk` `doc-confirmed`: Frontend foundation rollout and Phase E gap review files are archive pointers. Do not reopen phased rollout work or invent shared primitives from old history.
- `risk` `owner-confirmed`: Donor/reference code such as Metronic can overload context and blur product ownership if read by default. Use the reference-code policy and distill lessons into module memory.
- `risk` `owner-confirmed`: PWA/offline and Flutter/mobile references can be misread as current scope. Treat them as future/deferred unless the owner explicitly activates that work.
- `risk` `doc-confirmed`: Install helper can be confused with offline PWA work. Current install prompt runtime is active, but service worker/offline/local sync remain future proposal scope.
- `risk` `doc-confirmed`: Deferred composed UI surfaces can be misread as UI Kit/UI Lab scope. Treat `proposals/deferred-composed-surfaces.md` as future proposal and start app-layer-first only after owner activation.
- `risk` `owner-confirmed`: Raw reference packs now live under ignored local `reference-code/`. Use `reference-pack:*` aliases and do not treat old pointer paths as product docs.
- `risk` `doc-confirmed`: Legacy PostgreSQL SQL can mislead agents if read as current schema. Use `contracts/schema-tenancy.md`, `contracts/migrations.md`, and the archive index before opening the SQL.
- `risk` `doc-confirmed`: Backend old root-path docs still exist for compatibility. Do not treat them as active ownership when a target-folder doc exists.
- `risk` `doc-confirmed`: Historical `platform/docs/ai/**` content still exists in the repository. Use `ai-memory/durable/legacy-memory-import.md` only when historical reconstruction is explicitly needed.
- `risk` `doc-confirmed`: Old `platform/docs/ai/prompts/**`, `templates/**`, and `runs/**` still exist as legacy provenance after the Atlas operational cutover. Do not write new workflow artifacts there.
- `risk` `doc-confirmed`: Most old `platform/docs/ai/**` payload files still exist until the retirement plan is executed. Use `ai-memory/atlas/platform-docs-ai-retirement-plan.md` before deleting or compacting them.

## Recommended Reads By Domain

- Auth/session: `ai-memory/modules/domains/auth-and-session/README.md`
- Schema/tenancy: `ai-memory/modules/domains/schema-and-tenancy/README.md`
- Admin control plane: `ai-memory/modules/domains/admin-control-plane/README.md`
- Admin module registry: `ai-memory/modules/domains/admin-module-registry/README.md`
- Collection Table: `ai-memory/modules/domains/collection-table/README.md`
- UI Kit: `ai-memory/modules/frontend/ui-kit/README.md`
- UI Lab tracked guide: `platform/frontend/docs/guides/ui-lab.md`
- Install helper tracked guide: `platform/frontend/docs/guides/install-helper.md`
- Frontend local dev guide: `platform/frontend/docs/guides/local-dev.md`
- Tenant Web: `ai-memory/modules/frontend/tenant-web/README.md`
- Tenant Web tracked module doc: `platform/frontend/docs/modules/tenant-web.md`
- Deferred composed UI surfaces proposal: `platform/frontend/docs/proposals/deferred-composed-surfaces.md`
- Frontend docs map: `ai-memory/docs/frontend/doc-map.md`
- Backend docs map: `ai-memory/docs/backend/doc-map.md`
- Backend runbooks: `platform/backend/docs/runbooks/local-bootstrap.md`, `platform/backend/docs/runbooks/auth-key-sources.md`, `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
- Backend proposals/reference/archive: `platform/backend/docs/proposals/kms-signing.md`, `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`, `platform/backend/docs/proposals/api-gateway-proxy-routing.md`, `platform/backend/docs/proposals/events-mails-cleanup.md`, `platform/backend/docs/proposals/schema-drift-checks.md`, `platform/backend/docs/reference/import-field-mapping.md`, `platform/backend/docs/reference/tenant-import-boundary.md`, `platform/backend/docs/archive/README.md`, `platform/backend/docs/archive/postgres-archive/README.md`
- Target docs rewrite structure: `ai-memory/docs/target-docs-structure.md`
- Platform Studio suite: `ai-memory/modules/domains/platform-studio/README.md`
- Platform Studio tracked suite docs: `platform/frontend/docs/contracts/platform-studio.md` and `platform/frontend/docs/modules/platform-studio/README.md`
- Form Builder tracked contract: `platform/frontend/docs/modules/platform-studio/form-builder.md`
- Form Builder field/catalog supporting contract: `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- Form Builder old detail triage: `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- Form Builder backend contract: `platform/backend/docs/contracts/platform-studio-form-builder.md`
- Form Builder backend module map: `platform/backend/docs/modules/platform-studio/form-builder.md`
- Platform Studio tool map: `ai-memory/modules/domains/platform-studio/tools/README.md`
- Reference code policy: `ai-memory/durable/reference-code-policy.md`
- Reference code alias registry: `docs/ref/reference-code.md`
- Reference code relocation checkpoint: `ai-memory/reference-code/relocation-checkpoint.md`
- Atlas workflow: `ai-memory/atlas/README.md` and `ai-memory/atlas/migration-audit.md`
- Platform docs AI retirement plan: `ai-memory/atlas/platform-docs-ai-retirement-plan.md`
