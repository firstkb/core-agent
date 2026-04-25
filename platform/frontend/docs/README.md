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

## Current Compatibility Pointers

These old root/platform-studio paths remain as compatibility pointers during the migration.
They are not part of the active read order:

- `install-helper-runtime.md`
- `app-surfaces.md`
- `package-boundaries.md`
- `tenant-model.md`
- `offline-strategy.md`
- `auth-agent-integration-brief.md`
- `auth-runtime-followups.md`
- `collection-table-runtime-contract.md`
- `collection-table-backend-integration-contract.md`
- `collection-table-shared-readiness-plan.md`
- `admin-module-registry-backend-handoff.md`
- `ui-delivery-order.md`
- `layout-baseline.md`
- `ui-kit-boundary-audit.md`
- `ui-kit-stable-approved-audit.md`
- `ui-lab-structure.md`
- `ui-lab-ui-kit-coverage.md`
- `deferred-composed-surfaces.md`
- `foundation-rollout-plan.md`
- `phase-e-gap-review.md`
- `platform-studio/README.md`
- `platform-studio/taxonomy-and-naming.md`
- `platform-studio/form-builder-first-contract.md`
- `platform-studio/form-builder-three-schema-contract.md`
- `platform-studio/form-builder-runtime-naming-contract-v1-1.md`
- `platform-studio/form-builder-runtime-view-strategy-v1.md`
- `platform-studio/form-builder-runtime-routes-contract-v1.md`
- `platform-studio/form-builder-runtime-access-and-entry-context-v1.md`
- `platform-studio/form-builder-package-boundary-plan-v1.md`
- `platform-studio/form-builder-static-models-schema-contract-v1.md`
- `platform-studio/form-builder-import-bundle-contract-v1.md`
- `platform-studio/form-builder-accepted-registry.md`
- `platform-studio/form-builder-field-catalog.md`
- `platform-studio/form-builder-v2-field-contract.md`
- `platform-studio/form-builder-*fields*.md`
- `platform-studio/form-builder-*rules*.md`
- `platform-studio/form-builder-*view-settings*.md`
- `platform-studio/form-builder-grid-columns-contract.md`
- `platform-studio/form-builder-schema-scope-contract.md`
- `platform-studio/form-builder-subform-checklist-contract.md`
- `platform-studio/form-builder-backend*.md`
- `platform-studio/form-builder-storage-and-sql-view-contract.md`
- `platform-studio/form-builder-runtime-storage-review-brief.md`

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
Form Builder is active; Navigation Builder, Action Builder, PDF Builder, and Report Builder are planned tools.

## Reference And Donor Material

Opt-in only:

- `vendor/**`
- `metronic/**`
- `platform-studio/EXTDB/**`
- `platform-studio/old-code-reference/**`
- `platform-studio/ezform/**`
- `platform-studio/smartapp/**`

Reference and donor material is not product truth and must not be read by default.
Use `docs/ref/reference-code.md` for stable `reference-pack:*` aliases before opening donor code.
Future physical docs rewrite should move compact reference metadata under `reference/`; current old donor paths remain reference-only compatibility locations.
