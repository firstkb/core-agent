# Frontend Docs

Status: active index
Owner: frontend
Last audited: 2026-04-25
Canonical scope: tracked frontend documentation entrypoint

This index points agents to the active frontend docs set.
Read contract docs first, then module-specific docs, then guides/proposals/reference only when the task requires them.

## Active Contracts

- `contracts/workspace.md`: frontend apps, packages, current online web delivery strategy, and workspace read path.
- `contracts/app-surfaces.md`: current app ownership for `platform-admin-web` and `tenant-web`.
- `contracts/package-boundaries.md`: package responsibilities, import rules, and promotion rules.
- `contracts/tenant-model.md`: tenant shared logic boundary for `tenant-core` versus apps.
- `contracts/auth-runtime.md`: frontend auth runtime, cookie refresh, profile bootstrap, and auth client behavior.
- `contracts/collection-table.md`: frontend Collection Table package/runtime contract and host adapter boundary.
- `contracts/ui-kit.md`: UI Kit boundary, promotion rules, stable/provisional sets, layout baseline, and delivery order.
- `contracts/platform-studio.md`: Platform Studio suite boundary, tool ownership, tenant-web/shared package split, and canonical naming.

## Future Proposals

- `proposals/pwa-offline.md`: future PWA/offline and Flutter/hybrid mobile boundary. Not active implementation scope.
- `proposals/deferred-composed-surfaces.md`: future workflow-shaped UI surfaces that stay app-layer-first until explicitly activated.

## Retired Pointers

Old root compatibility/archive pointer files were deleted after compaction.
Use active contracts, modules, guides, proposals, or git history for exact old
text.

Old frontend-owned Platform Studio backend-facing pointer files were also
deleted after backend facts were compacted into
`platform/backend/docs/contracts/platform-studio-form-builder.md`.

Retained old Platform Studio field/catalog/rules/view-settings docs are not
compatibility pointers. They are exact detail references and should be opened
only after `modules/platform-studio/form-builder-fields.md` is insufficient.

## Active Module Docs

- `modules/platform-admin-web.md`: admin web shell, profile/navigation bootstrap, sidebar/favorites, admin Collection Table consumers, and root/non-root frontend boundaries.
- `modules/tenant-web.md`: tenant web shell, public auth/profile bootstrap, Platform Studio ownership, tenant-core boundary, install-helper placement, and future PWA/mobile exclusions.
- `modules/platform-studio/README.md`: Platform Studio suite module index and read order.
- `modules/platform-studio/form-builder.md`: active Form Builder authoring/runtime contract.
- `modules/platform-studio/form-builder-fields.md`: supporting Form Builder field catalog, palette registry, rules, grid, view settings, and scope boundaries.

## Active Guides

- `guides/ui-lab.md`: UI Lab route, section model, review coverage, and editing rules.
- `guides/install-helper.md`: current install prompt/runtime guide for admin and tenant public auth screens.
- `guides/local-dev.md`: local frontend dev commands, HTTPS proxy modes, ports, domains, and checks.

## Platform Studio

Tracked Platform Studio entrypoint:

- `contracts/platform-studio.md`
- `modules/platform-studio/README.md`
- `modules/platform-studio/form-builder.md`
- `modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

Platform Studio is the tenant-web builder/configuration tool suite.
Form Builder is active; Navigation Builder has an active UI-first V1 surface; Action Builder, PDF Builder, and Report Builder are planned tools.

## Reference And Donor Material

Opt-in only:

- `vendor/**`
- `maestro/memory/reference-code/README.md`
- `reference-pack:*` aliases for local-only raw packs

Reference and donor material is not product truth and must not be read by default.
Use `maestro/memory/reference-code/README.md` for stable `reference-pack:*` aliases before opening donor code.
Raw donor/reference packs are local-only under `reference-code/**`; old donor compatibility directories under frontend docs were deleted.
