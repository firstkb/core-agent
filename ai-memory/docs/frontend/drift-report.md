# Frontend Docs Drift Report

Status: active drift map
Last compacted: 2026-04-25

This file records known drift between tracked frontend docs and current compact memory/code state.
It prevents agents from treating stale source text as current truth.

## Known Drift

### Collection Table Package Extraction

Tracked docs:

- `platform/frontend/docs/contracts/collection-table.md`
- `platform/backend/docs/contracts/collection-table.md`

Observed state:

- The active Collection Table contracts now live under `contracts/collection-table.md`.
- The old pointer-only Collection Table root/readiness docs were deleted after compaction.
- `@platform/collection-table` exists under `platform/frontend/packages/collection-table`.
- Current code-confirmed admin consumers are Module Registry, Employees, and Tenants.

Current read rule:

- Read `platform/frontend/docs/contracts/collection-table.md` for frontend runtime/package behavior.
- Read `platform/backend/docs/contracts/collection-table.md` for backend DTOs, preferences, and endpoint families.
- Use git history only when exact old root Collection Table text is required.

### Auth Follow-Up State

Tracked doc:

- `platform/frontend/docs/contracts/auth-runtime.md`

Observed drift:

- The old `auth-runtime-followups.md` pointer-only file was deleted after compaction.
- Current frontend auth behavior is tracked in `platform/frontend/docs/contracts/auth-runtime.md`.
- Older follow-up wording made landed cookie-refresh work look incomplete.

Current read rule:

- Read `platform/frontend/docs/contracts/auth-runtime.md` for tracked frontend auth behavior.
- Use git history only when exact old auth follow-up or integration-brief text is required.

### Frontend Auth Slice Migrated

Tracked docs:

- `platform/frontend/docs/contracts/auth-runtime.md`

Observed state:

- The old frontend auth integration brief pointer was deleted after compaction.
- The old follow-up doc was deleted after compaction.
- The active tracked frontend auth contract is contract-first.

Current read rule:

- Prefer `contracts/auth-runtime.md` for frontend auth behavior.

### Frontend AGENTS Runtime Guidance

Tracked doc:

- `platform/frontend/AGENTS.md`

Observed drift:

- It now references Atlas/ramp-conductor routing through the `ai-memory` read order.
- Root repository guidance defines the active Codex-native runtime and this local `ai-memory` overlay is the compact retrieval layer.

Current read rule:

- Root `AGENTS.md`, `platform/AGENTS.md`, and `ai-memory/` routing win for local AI work.
- Keep frontend package/auth/layout rules from `platform/frontend/AGENTS.md`.

### Source Markdown Links

Tracked docs with machine-local absolute markdown links were observed in frontend docs.
This is not acceptable for new memory docs and should be repaired during physical tracked-doc reorg.

Current rule:

- New `ai-memory` docs use repo-relative paths only.
- Do not copy machine-local links into new docs.
The old auth follow-up pointer was deleted; recover exact old text from git
history only if required.

### Platform Studio Active Set Overload

Tracked doc:

- `platform/frontend/docs/README.md`
- active Platform Studio docs under `platform/frontend/docs/contracts/` and `platform/frontend/docs/modules/platform-studio/`

Observed drift:

- The old suite-level Platform Studio pointer docs were deleted after compaction.
- The active suite-level tracked docs are `platform/frontend/docs/contracts/platform-studio.md` and `platform/frontend/docs/modules/platform-studio/README.md`.
- The old taxonomy and hot Form Builder pointer-only docs were deleted after compaction.
- The active Form Builder tracked doc is `platform/frontend/docs/modules/platform-studio/form-builder.md`.
- Field/catalog/rules/view-settings details now have a compact supporting tracked doc at `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
- `ai-memory/docs/frontend/platform-studio/doc-map.md` now defines a smaller hot source set and classifies supporting/working/archive candidates.

Current read rule:

- Read the new suite contract and module entrypoint before opening detailed Form Builder source docs.
- Read `platform/frontend/docs/modules/platform-studio/form-builder.md` for current Form Builder authoring/runtime behavior.
- Read `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` for field catalog, palette registry, rules, grid/view settings, and scope boundaries.
- Read `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md` before opening old Form Builder detail/workstream docs.
- Read `platform/backend/docs/contracts/platform-studio-form-builder.md` for backend-owned Form Builder API/storage/runtime apply behavior.
- Use Platform Studio compact map before opening older tracked Platform Studio source docs.

### Platform Studio Backend-Facing Form Builder Docs Migrated

Tracked docs:

- `platform/backend/docs/contracts/platform-studio-form-builder.md`

Observed state:

- Backend-owned facts are compacted into the backend contract.
- Old frontend backend-facing pointer docs were deleted after compaction.
- Older `publishBuilderDraft` lifecycle wording is superseded by authoring save plus additive runtime apply.
- Older `vw_ps_*` storage examples are superseded by current `vw_` canonical view and `vg_` grid view naming.

Current read rule:

- Use the backend contract for implementation.
- Use old frontend backend-facing docs only for historical audit detail.

### PWA And Offline Scope

Tracked docs may mention PWA or deferred tenant app delivery.

Observed drift:

- Current owner-confirmed strategy is online web applications first.
- Offline PWA and Flutter/hybrid mobile are future delivery layers after the main platform stabilizes.
- The frontend workspace slice now stores current PWA/offline scope in `platform/frontend/docs/proposals/pwa-offline.md`.

Current read rule:

- Treat PWA/offline/mobile references as proposals unless the owner explicitly activates that work.
- Do not add service-worker sync, offline-first persistence, or mobile shell assumptions to current frontend tasks by default.
- Prefer `platform/frontend/docs/proposals/pwa-offline.md`; the old `offline-strategy.md` redirect file was deleted.

### Frontend Workspace Slice Migrated

Tracked docs:

- `platform/frontend/docs/contracts/workspace.md`
- `platform/frontend/docs/contracts/app-surfaces.md`
- `platform/frontend/docs/contracts/package-boundaries.md`
- `platform/frontend/docs/contracts/tenant-model.md`
- `platform/frontend/docs/proposals/pwa-offline.md`

Observed state:

- Old app-surface, package-boundary, tenant-model, and offline root redirect files were deleted after compaction.
- The active tracked workspace contract is contract-first.

Current read rule:

- Prefer the new `contracts/` and `proposals/` paths.
- Use old root paths only for compatibility with existing links.

### Frontend Active Docs Final Consistency Pass

Tracked docs:

- `platform/frontend/docs/README.md`
- `platform/frontend/docs/contracts/**`
- `platform/frontend/docs/modules/**`
- `platform/frontend/docs/guides/**`
- `platform/frontend/docs/proposals/**`

Observed state:

- Active frontend docs now use target-folder `Read with` or `Read Order` links.
- Old root pointer docs were deleted; older `platform-studio/**` docs are exact-detail, archive, proposal, or reference-only inputs.
- Vendor metadata under `platform/frontend/docs/vendor/**` is reference-only; raw donor material stays behind `reference-pack:*` aliases.

Current read rule:

- Prefer target-folder docs for active frontend work.
- Open old `platform-studio/**` docs only when the target doc explicitly says exact-detail or historical audit is needed.
- Do not read the whole `platform/frontend/docs/platform-studio/**` tree by default.

### Install Helper Guide Migrated

Tracked docs:

- `platform/frontend/docs/guides/install-helper.md`
- `platform/frontend/docs/proposals/pwa-offline.md`

Observed state:

- The active install helper guide now lives in `guides/install-helper.md`.
- The old root install helper pointer doc was deleted after compaction.
- Current install helper is an install prompt/runtime surface for public auth screens, not offline-first or service-worker scope.

Current read rule:

- Prefer `guides/install-helper.md` for install prompt behavior, browser handling, public-auth placement, and update-flow boundary.
- Prefer `proposals/pwa-offline.md` for future offline/PWA strategy.
- Do not treat install helper work as activation of service workers, local sync, or mobile app delivery.

### Local Dev Guide Landed

Tracked docs:

- `platform/frontend/docs/guides/local-dev.md`
- `platform/frontend/README.md`
- `platform/frontend/AGENTS.md`
- `platform/frontend/package.json`

Observed state:

- The active operational frontend local-dev guide now lives in `guides/local-dev.md`.
- README and AGENTS still contain useful command lists, but the tracked guide is the compact read path for agents.
- Local HTTPS/Caddy/proxy setup is development-only and does not redefine app delivery strategy.

Current read rule:

- Prefer `guides/local-dev.md` for local dev commands, HTTPS modes, ports, domains, and checks.
- Prefer workspace/app-surface contracts for product ownership and app delivery strategy.

### Platform Admin Web Slice Migrated

Tracked docs:

- `platform/frontend/docs/modules/platform-admin-web.md`

Observed state:

- The old admin Module Registry backend handoff pointer-only file was deleted after compaction.
- The active admin web shell/navigation/favorites behavior is tracked in `modules/platform-admin-web.md`.

Current read rule:

- Prefer `modules/platform-admin-web.md` for admin web frontend behavior.
- Use backend admin and Collection Table contracts for backend-owned semantics.

### Tenant Web Slice Migrated

Tracked docs:

- `platform/frontend/docs/modules/tenant-web.md`
- `platform/frontend/apps/tenant-web/README.md`
- `platform/frontend/apps/tenant-web/src/README.md`

Observed state:

- The active tenant web module doc now lives in `modules/tenant-web.md`.
- Tenant app source READMEs are useful code-boundary hints, but they are not the full product/app contract.
- Current tenant delivery is online web; PWA/offline/mobile references remain future/deferred unless explicitly activated.
- Install helper is mounted on public auth screens only and does not activate service-worker/offline scope.

Current read rule:

- Prefer `modules/tenant-web.md` for tenant shell, auth/profile bootstrap, Platform Studio ownership, tenant-core boundary, and PWA/mobile exclusions.
- Use workspace/app-surface/tenant-model/auth contracts for cross-cutting boundaries.
- Use `proposals/pwa-offline.md` for future offline/PWA/mobile strategy.

### UI Kit Slice Migrated

Tracked docs:

- `platform/frontend/docs/contracts/ui-kit.md`

Observed state:

- The active UI Kit governance contract now lives in `contracts/ui-kit.md`.
- Old UI delivery, layout, boundary, and stable approval pointer docs were deleted after compaction.
- Physical presence in `@platform/ui-kit` is not the same as stable approval.

Current read rule:

- Prefer `contracts/ui-kit.md` for UI Kit promotion, stable/provisional status, layout baseline, and donor extraction order.
- Use `guides/ui-lab.md` for detailed review surface behavior and coverage inventory.

### UI Lab Guide Slice Migrated

Tracked docs:

- `platform/frontend/docs/guides/ui-lab.md`

Observed state:

- The active UI Lab guide now lives in `guides/ui-lab.md`.
- Old UI Lab structure and coverage pointer docs were deleted after compaction.
- UI Lab coverage proves review visibility, not UI Kit approval by itself.

Current read rule:

- Prefer `guides/ui-lab.md` for UI Lab route, section model, coverage rules, and editing rules.
- Prefer `contracts/ui-kit.md` for promotion and approval boundaries.
- Verify current `@platform/ui-kit` exports and UI Lab panel code before implementing from coverage facts.

### Deferred Composed Surfaces Proposal Migrated

Tracked docs:

- `platform/frontend/docs/proposals/deferred-composed-surfaces.md`

Observed state:

- The active future/backlog proposal now lives in `proposals/deferred-composed-surfaces.md`.
- The old root pointer doc was deleted after compaction.
- Remote table workspace, file upload workspace, AI assistant dialog, messenger, and kanban remain future/app-layer-first scope.

Current read rule:

- Prefer `proposals/deferred-composed-surfaces.md` for workflow-shaped UI backlog boundaries.
- Do not treat the proposal as active implementation scope without owner activation.
- Do not promote whole workflow surfaces into UI Kit or UI Lab; extract only proven generic pieces later.

### Frontend Foundation History Archived

Tracked docs:

- `platform/frontend/docs/contracts/ui-kit.md`
- `platform/frontend/docs/guides/ui-lab.md`

Observed state:

- The foundation rollout and Phase E gap review are closed history.
- Durable foundation baseline, gap discipline, and UI Lab review lessons are compacted into the active UI Kit contract and UI Lab guide.
- Old foundation/gap root pointer paths were deleted after compaction.

Current read rule:

- Prefer `contracts/ui-kit.md` for foundation baseline, promotion, approval, and gap-discipline rules.
- Prefer `guides/ui-lab.md` for review-surface and example-quality rules.
- Use git history only for old rollout/gap audit.

## Follow-Up During Physical Docs Reorg

- Collection Table, install helper, UI foundation, UI Lab, deferred composed surfaces, foundation rollout, and Phase E root pointer docs were deleted after compaction.
- Tenant app source READMEs are source overviews; use `platform/frontend/docs/modules/tenant-web.md` as the active tenant app module doc.
- Rewrite `auth-runtime-followups.md` as current state/open cleanup only, or archive it if all gaps are closed.
- Update `platform/frontend/AGENTS.md` to align with current Codex-native and `ai-memory` read path if the owner wants tracked docs to reflect local workflow.
- Repair machine-local absolute links in tracked docs.
- Reduce `platform/frontend/docs/README.md` to a compact index that points to active contracts and compact maps.
- Move remaining PWA/offline and Flutter/mobile content into future proposal docs, not active app contracts.
