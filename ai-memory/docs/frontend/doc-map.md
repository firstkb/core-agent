# Frontend Source Doc Classification

Status: compact classification
Last compacted: 2026-04-25

Scope: `platform/frontend/docs/**`

This map classifies tracked frontend docs for selective AI retrieval.
It does not physically move tracked files.
Use `ai-memory` module packs first, then open only the exact tracked docs needed for the task.

## Global Rule

Do not start frontend work by reading the whole `platform/frontend/docs` tree.

Read order:

1. `ai-memory/index/memory-index.yaml`
2. relevant `ai-memory/modules/frontend/**` or `ai-memory/modules/domains/**`
3. this map
4. exact tracked source docs named below
5. code

## Default Avoid Set

- `platform/frontend/docs/metronic/**`
- `platform/frontend/docs/vendor/**`
- `platform/frontend/docs/platform-studio/EXTDB/**`
- `platform/frontend/docs/platform-studio/old-code-reference/**`
- `platform/frontend/docs/platform-studio/ezform/**`
- `platform/frontend/docs/platform-studio/smartapp/**`
- prompt files and one-off workstream prompts

## Workspace And Package Boundaries

Current contract-first docs:

| Source | Classification | Read When |
| --- | --- | --- |
| `platform/frontend/docs/contracts/workspace.md` | `hot_contract` | Frontend apps, packages, current online web delivery, workspace read path. |
| `platform/frontend/docs/contracts/app-surfaces.md` | `hot_contract` | App ownership, admin vs tenant surfaces, `tenant-pwa` deferral. |
| `platform/frontend/docs/contracts/package-boundaries.md` | `hot_contract` | Package responsibilities, import rules, `platform-studio-core`, `ui-kit` boundaries. |
| `platform/frontend/docs/contracts/tenant-model.md` | `hot_contract` | `tenant-core` ownership and tenant-aware app logic split. |
| `platform/frontend/docs/guides/install-helper.md` | `hot_guide` | Current install prompt/runtime behavior for public auth screens; not offline-first scope. |
| `platform/frontend/docs/guides/local-dev.md` | `hot_guide` | Frontend local dev commands, HTTPS proxy modes, ports, domains, and checks. |
| `platform/frontend/docs/proposals/pwa-offline.md` | `future_proposal` | PWA/offline or Flutter/hybrid mobile questions. Not active implementation scope. |

Compatibility pointers:

| Source | Classification | Read When |
| --- | --- | --- |
| `platform/frontend/docs/README.md` | `tracked_index` | Need tracked source index; old root/platform-studio paths listed there are compatibility-only. |
| `platform/frontend/docs/app-surfaces.md` | `compatibility_pointer` | Old path; read `contracts/app-surfaces.md` instead. |
| `platform/frontend/docs/package-boundaries.md` | `compatibility_pointer` | Old path; read `contracts/package-boundaries.md` instead. |
| `platform/frontend/docs/tenant-model.md` | `compatibility_pointer` | Old path; read `contracts/tenant-model.md` instead. |
| `platform/frontend/docs/offline-strategy.md` | `compatibility_pointer` | Old path; read `proposals/pwa-offline.md` instead. |
| `platform/frontend/docs/install-helper-runtime.md` | `compatibility_pointer` | Old path; read `guides/install-helper.md` instead. |

## Auth

| Source | Classification | Read When |
| --- | --- | --- |
| `platform/frontend/docs/contracts/auth-runtime.md` | `hot_contract` | Frontend auth runtime, OTP, cookie refresh, access-token state, profile bootstrap, auth client behavior. |
| `platform/frontend/docs/auth-runtime-followups.md` | `compatibility_pointer` | Old path; read `contracts/auth-runtime.md` instead. |

The old auth integration brief pointer-only file was deleted after compaction.

## Collection Table

Read `platform/frontend/docs/contracts/collection-table.md` for the tracked frontend contract.
Read `platform/backend/docs/contracts/collection-table.md` for backend DTOs, preferences, and endpoint families.

| Source | Classification | Read When |
| --- | --- | --- |
| `platform/frontend/docs/contracts/collection-table.md` | `hot_contract` | Current frontend package/runtime contract, host adapter boundary, table metadata, state, actions, and current consumers. |
| `platform/frontend/docs/collection-table-shared-readiness-plan.md` | `compatibility_pointer` | Superseded extraction plan; package extraction has landed. |

Old Collection Table root contract pointer-only files were deleted after
compaction.

## Platform Admin Web

| Source | Classification | Read When |
| --- | --- | --- |
| `platform/frontend/docs/modules/platform-admin-web.md` | `hot_module_doc` | Admin shell, profile/navigation bootstrap, sidebar/favorites, admin Collection Table consumers, and root/non-root frontend visibility. |

The old admin backend handoff pointer-only file was deleted after compaction.

## Tenant Web

| Source | Classification | Read When |
| --- | --- | --- |
| `platform/frontend/docs/modules/tenant-web.md` | `hot_module_doc` | Tenant shell, public auth/profile bootstrap, Platform Studio ownership, tenant-core boundary, install-helper placement, and future PWA/mobile exclusions. |
| `platform/frontend/apps/tenant-web/README.md` | `source_overview` | App-local code boundary overview only; prefer the tracked module doc first. |
| `platform/frontend/apps/tenant-web/src/README.md` | `source_overview` | Source folder overview only; prefer the tracked module doc first. |

## UI Foundation And UI Kit

| Source | Classification | Read When |
| --- | --- | --- |
| `platform/frontend/docs/contracts/ui-kit.md` | `hot_contract` | Current UI Kit boundary, promotion rules, stable/provisional sets, layout baseline, and delivery order. |
| `platform/frontend/docs/guides/ui-lab.md` | `hot_guide` | Current UI Lab route, section model, review coverage, and editing rules. |
| `platform/frontend/docs/ui-delivery-order.md` | `compatibility_pointer` | Old path; read `contracts/ui-kit.md` instead. |
| `platform/frontend/docs/layout-baseline.md` | `compatibility_pointer` | Old path; read `contracts/ui-kit.md` instead. |
| `platform/frontend/docs/ui-kit-boundary-audit.md` | `compatibility_pointer` | Old path; read `contracts/ui-kit.md` instead. |
| `platform/frontend/docs/ui-kit-stable-approved-audit.md` | `compatibility_pointer` | Old path; read `contracts/ui-kit.md` instead. |
| `platform/frontend/docs/ui-lab-structure.md` | `compatibility_pointer` | Old path; read `guides/ui-lab.md` instead. |
| `platform/frontend/docs/ui-lab-ui-kit-coverage.md` | `compatibility_pointer` | Old path; read `guides/ui-lab.md` instead and verify current exports before implementation. |
| `platform/frontend/docs/proposals/deferred-composed-surfaces.md` | `future_proposal` | Larger workflow-shaped surfaces deferred from `ui-kit` and UI Lab; owner activation required before implementation. |
| `platform/frontend/docs/deferred-composed-surfaces.md` | `compatibility_pointer` | Old path; read `proposals/deferred-composed-surfaces.md` instead. |
| `platform/frontend/docs/foundation-rollout-plan.md` | `archive_compatibility_pointer` | Old closed rollout path; durable lessons are in `contracts/ui-kit.md` and `guides/ui-lab.md`. |
| `platform/frontend/docs/phase-e-gap-review.md` | `archive_compatibility_pointer` | Old closed gap-review path; durable lessons are in `contracts/ui-kit.md` and `guides/ui-lab.md`. |

## Platform Studio

Handled by a dedicated compact map:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `ai-memory/docs/frontend/platform-studio/README.md`
- `ai-memory/docs/frontend/platform-studio/doc-map.md`

Compatibility and historical inputs:

- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/form-builder-backend*.md`
- `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md`

Pointer-only taxonomy and hot Form Builder contract files were deleted after
compaction. Use the active Platform Studio/Form Builder docs or git history for
exact old text.

## Vendor And Donor Material

| Source | Classification | Handling |
| --- | --- | --- |
| `platform/frontend/docs/vendor/**` | `reference_only` | Vendor inventory and extraction notes only. |
| `platform/frontend/docs/metronic/**` | `reference_only` | Large donor source; use `reference-pack:metronic`; never default context. |
| `platform/frontend/docs/platform-studio/EXTDB/**` | `reference_only` | Legacy behavior source; use `reference-pack:extdb-legacy`; never default context. |
| `platform/frontend/docs/platform-studio/ezform/**` | `reference_only` | Prototype interaction reference; use `reference-pack:ezform-prototype`; never default context. |
| `platform/frontend/docs/platform-studio/smartapp/**` | `reference_only` | Runtime donor reference; use `reference-pack:smartapp-runtime`; never default context. |
| `platform/frontend/docs/platform-studio/old-code-reference/**` | `reference_only` | Historical old builder reference; use `reference-pack:old-builder-reference`; never default context. |

Tracked alias registry:

- `docs/ref/reference-code.md`

## Proposed Future Tracked Layout

If the owner approves physical docs reorg later, use this target:

- `platform/frontend/docs/contracts/`
- `platform/frontend/docs/modules/`
- `platform/frontend/docs/guides/`
- `platform/frontend/docs/reference/`
- `platform/frontend/docs/archive/`

Recommended grouping:

- `contracts/workspace.md`: active tracked workspace contract.
- `contracts/app-surfaces.md`: active tracked app ownership contract.
- `contracts/package-boundaries.md`: active tracked package boundary contract.
- `contracts/tenant-model.md`: active tracked tenant shared-logic contract.
- `proposals/pwa-offline.md`: future PWA/offline and Flutter/hybrid mobile proposal.
- `guides/install-helper.md`: landed as current install prompt/runtime guide.
- `guides/local-dev.md`: landed as current frontend local development guide.
- `contracts/auth.md`: auth integration brief plus current cleanup state.
- `contracts/auth-runtime.md`: active tracked frontend auth contract.
- `contracts/collection-table.md`: landed as current frontend Collection Table package/runtime contract.
- `modules/platform-admin-web.md`: landed as current admin web shell/navigation/favorites module doc.
- `modules/tenant-web.md`: landed as current tenant shell/auth/bootstrap, Platform Studio ownership, tenant-core boundary, install-helper placement, and future PWA/mobile exclusion module doc.
- `contracts/platform-studio.md`: landed as current Platform Studio suite contract.
- `modules/platform-studio/README.md`: landed as current Platform Studio suite module entrypoint.
- `modules/platform-studio/form-builder.md`: landed as current active Form Builder authoring/runtime contract.
- `modules/platform-studio/form-builder-fields.md`: landed as current supporting Form Builder field/catalog/rules/view-settings contract.
- `contracts/ui-kit.md`: landed as current UI Kit governance contract.
- `proposals/deferred-composed-surfaces.md`: landed as future workflow-shaped UI surfaces proposal.
- `guides/ui-lab.md`: UI Lab structure and coverage.
- `archive/foundation-rollout-plan.md`: old path is already an archive compatibility pointer.
- `archive/phase-e-gap-review.md`: old path is already an archive compatibility pointer.
- `reference/vendor/**` and `reference/metronic/**`: compact donor metadata only; raw donor material moves to `reference-code/**` or private reference storage.
