# Docs And Memory Routing Decisions

Status: durable decision topic
Last compacted: 2026-05-01
Index: `maestro/memory/durable/decisions-log.md`

## Purpose

Docs migration, compact memory routing, source-of-truth rules, reference-code policy, memory checks, and retained-detail policy.

## Rules

- Decision IDs are stable and must not be renumbered.
- Preserve deleted-path sources as provenance when they explain history.
- Prefer current canonical docs or compact memory routes for active reads.
- Add new decisions through `maestro/memory/durable/decisions-log.md` first, then place details in the relevant topic file.

## Decisions

### DEC-021 Backend Docs Use Compact Classification Before Deep Reads

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Backend docs are useful but mixed-status. Agents should read compact backend memory and `maestro/memory/docs/backend/doc-map.md` before opening deep tracked backend docs, and should avoid legacy archives, old standards, prompts, proposed gateway plans, and completed refactor plans by default.
- Sources:
  - `platform/backend/docs/README.md`
  - `platform/backend/docs/contracts/runtime-wiring.md`
  - `platform/backend/docs/contracts/auth-gateway.md`
  - `platform/backend/docs/contracts/schema-tenancy.md`
  - `maestro/memory/docs/backend/doc-map.md`

### DEC-022 Reference Code Is Opt-In Donor Material

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Reference code such as Metronic should be governed by a local reference-code policy, excluded from the default AI read path, and distilled into product/module memory instead of copied into active docs.
- Sources:
  - Owner clarification in current memory-building session
  - `maestro/memory/durable/reference-code-policy.md`
  - `maestro/memory/reference-code/README.md`

### DEC-024 FE/BE Docs Rewrite Will Use Contract-First Target Structure

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: The later physical rewrite of `platform/frontend/docs` and `platform/backend/docs` should separate active contracts, module docs, guides/runbooks, proposals, reference material, and archives. No tracked docs are moved during planning.
- Sources:
  - `maestro/memory/docs/target-docs-structure.md`
  - `maestro/memory/docs/frontend/doc-map.md`
  - `maestro/memory/docs/backend/doc-map.md`

### DEC-026 Frontend Workspace Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The first frontend docs migration slice landed as tracked contract-first docs under `platform/frontend/docs/contracts/` plus proposal scope for PWA/offline under `platform/frontend/docs/proposals/`. Old root workspace pointer paths were later deleted.
- Sources:
  - `platform/frontend/docs/contracts/workspace.md`
  - `platform/frontend/docs/contracts/app-surfaces.md`
  - `platform/frontend/docs/contracts/package-boundaries.md`
  - `platform/frontend/docs/contracts/tenant-model.md`
  - `platform/frontend/docs/proposals/pwa-offline.md`

### DEC-027 Backend Runtime Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The backend runtime docs migration slice landed as tracked contract-first docs under `platform/backend/docs/contracts/runtime-wiring.md` and `platform/backend/docs/modules/runtime.md`. Old root runtime pointer paths were later deleted.
- Sources:
  - `platform/backend/docs/contracts/runtime-wiring.md`
  - `platform/backend/docs/modules/runtime.md`
  - `platform/backend/docs/README.md`

### DEC-028 Auth Cross-Stack Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The auth cross-stack docs migration slice landed as frontend `platform/frontend/docs/contracts/auth-runtime.md`, backend `platform/backend/docs/contracts/auth-gateway.md`, backend `platform/backend/docs/contracts/auth-control-schema.md`, and backend `platform/backend/docs/modules/auth.md`. Old FE/BE auth pointer paths were later deleted.
- Sources:
  - `platform/frontend/docs/contracts/auth-runtime.md`
  - `platform/backend/docs/contracts/auth-gateway.md`
  - `platform/backend/docs/contracts/auth-control-schema.md`
  - `platform/backend/docs/modules/auth.md`

### DEC-029 Schema And Tenancy Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The schema and tenancy docs migration slice landed as backend `platform/backend/docs/contracts/schema-tenancy.md` and `platform/backend/docs/contracts/migrations.md`. Old schema baseline and tenant canonical refactor pointer paths were later deleted.
- Sources:
  - `platform/backend/docs/contracts/schema-tenancy.md`
  - `platform/backend/docs/contracts/migrations.md`
  - `platform/backend/docs/README.md`

### DEC-030 Admin Control-Plane Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The admin control-plane docs migration slice landed as backend `platform/backend/docs/contracts/admin-control-plane.md` and `platform/backend/docs/contracts/admin-module-registry.md`. Old admin Module Registry and access-policy pointer paths were later deleted.
- Sources:
  - `platform/backend/docs/contracts/admin-control-plane.md`
  - `platform/backend/docs/contracts/admin-module-registry.md`
  - `platform/backend/docs/README.md`

### DEC-031 Collection Table Docs Use Cross-Stack Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Collection Table docs migration slice landed as frontend `platform/frontend/docs/contracts/collection-table.md` and backend `platform/backend/docs/contracts/collection-table.md`. Old frontend collection-table runtime, backend-integration, and shared-readiness pointer paths were later deleted.
- Sources:
  - `platform/frontend/docs/contracts/collection-table.md`
  - `platform/backend/docs/contracts/collection-table.md`
  - `platform/frontend/docs/README.md`
  - `platform/backend/docs/README.md`

### DEC-032 Platform Admin Web Docs Use Module Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Platform Admin Web docs migration slice landed as `platform/frontend/docs/modules/platform-admin-web.md`. The old admin Module Registry backend handoff pointer path was later deleted and no longer owns admin shell/navigation/favorites context.
- Sources:
  - `platform/frontend/docs/modules/platform-admin-web.md`
  - `platform/frontend/docs/admin-module-registry-backend-handoff.md`
  - `platform/frontend/docs/README.md`

### DEC-033 Platform Studio Suite Docs Use Contract And Module Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Platform Studio suite boundary slice landed as `platform/frontend/docs/contracts/platform-studio.md` and `platform/frontend/docs/modules/platform-studio/README.md`. The old suite-level pointer paths were deleted and no longer own the suite-level read path.
- Sources:
  - `platform/frontend/docs/contracts/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/README.md`

### DEC-034 Form Builder Docs Use Module Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Form Builder docs migration slice landed as `platform/frontend/docs/modules/platform-studio/form-builder.md`. Old hot Form Builder pointer files were deleted; retained old field/catalog docs are exact detail references only and no longer own the active Form Builder read path.
- Sources:
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/README.md`
  - `platform/frontend/docs/README.md`

### DEC-035 Backend Form Builder Docs Use Backend Contract Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Backend-owned Form Builder API, storage, validation, generated-object, and runtime apply facts now live in `platform/backend/docs/contracts/platform-studio-form-builder.md`. Old frontend backend-facing Form Builder pointer docs were deleted and must not be used as the active backend source of truth.
- Sources:
  - `platform/backend/docs/contracts/platform-studio-form-builder.md`
  - `platform/backend/docs/README.md`
  - `platform/frontend/docs/modules/platform-studio/README.md`

### DEC-036 Backend Form Builder Module Uses Implementation Map Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Backend Form Builder implementation orientation now lives in `platform/backend/docs/modules/platform-studio/form-builder.md`. It is the read-order and code-surface map over the backend contract, while `contracts/platform-studio-form-builder.md` remains the API/storage/runtime apply source of truth.
- Sources:
  - `platform/backend/docs/modules/platform-studio/form-builder.md`
  - `platform/backend/docs/contracts/platform-studio-form-builder.md`
  - `platform/backend/docs/README.md`

### DEC-037 UI Kit Docs Use Contract Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: UI Kit governance now lives in `platform/frontend/docs/contracts/ui-kit.md`. Old UI delivery order, layout baseline, boundary audit, and stable approved audit pointer paths were deleted and no longer own the active UI read path.
- Sources:
  - `platform/frontend/docs/contracts/ui-kit.md`
  - `platform/frontend/docs/README.md`
  - `platform/frontend/packages/ui-kit/README.md`

### DEC-038 UI Lab Docs Use Guide Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: UI Lab route, section model, review coverage, and editing rules now live in `platform/frontend/docs/guides/ui-lab.md`. The old UI Lab structure and UI Kit coverage inventory pointer paths were deleted and no longer own the active UI Lab read path.
- Sources:
  - `platform/frontend/docs/guides/ui-lab.md`
  - `platform/frontend/docs/README.md`

### DEC-039 Deferred Composed UI Surfaces Stay Proposal Scope

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Deferred workflow-shaped frontend surfaces now live in `platform/frontend/docs/proposals/deferred-composed-surfaces.md`. Remote table workspaces, file upload workspace, AI assistant dialog, full-screen messenger, and kanban task board remain future/app-layer-first scope until explicitly activated; they must not be promoted wholesale into UI Lab or UI Kit.
- Sources:
  - `platform/frontend/docs/proposals/deferred-composed-surfaces.md`
  - `platform/frontend/docs/README.md`

### DEC-040 Frontend Foundation History Is Archived

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The frontend foundation rollout and Phase E gap review are closed history. Durable lessons now live in `platform/frontend/docs/contracts/ui-kit.md` and `platform/frontend/docs/guides/ui-lab.md`; old root archive pointer paths were deleted and must not drive active shared-component work.
- Sources:
  - `platform/frontend/docs/contracts/ui-kit.md`
  - `platform/frontend/docs/guides/ui-lab.md`

### DEC-041 Install Helper Docs Use Guide Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Current frontend install prompt/runtime behavior now lives in `platform/frontend/docs/guides/install-helper.md`. The old `install-helper-runtime.md` pointer path was deleted. Install helper is active for public auth install prompting, but it does not activate service-worker, offline-first, local sync, or Flutter/hybrid mobile scope.
- Sources:
  - `platform/frontend/docs/guides/install-helper.md`
  - `platform/frontend/docs/proposals/pwa-offline.md`
  - `platform/frontend/docs/README.md`

### DEC-042 Frontend Local Dev Docs Use Guide Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Frontend local development commands, HTTPS proxy modes, local domains, ports, stop helpers, and build/check targets now live in `platform/frontend/docs/guides/local-dev.md`. This guide is operational and must not redefine product app ownership or activate offline/PWA/mobile scope.
- Sources:
  - `platform/frontend/docs/guides/local-dev.md`
  - `platform/frontend/README.md`
  - `platform/frontend/AGENTS.md`
  - `platform/frontend/package.json`

### DEC-043 Tenant Web Docs Use Module Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Tenant app shell/auth/bootstrap, Platform Studio ownership, tenant-core boundary, install-helper placement, and future PWA/mobile exclusions now live in `platform/frontend/docs/modules/tenant-web.md`. Tenant app source READMEs remain source overviews, not the active product/app contract.
- Sources:
  - `platform/frontend/docs/modules/tenant-web.md`
  - `platform/frontend/docs/contracts/app-surfaces.md`
  - `platform/frontend/docs/contracts/tenant-model.md`
  - `platform/frontend/docs/contracts/auth-runtime.md`
  - `platform/frontend/docs/guides/install-helper.md`
  - `platform/frontend/docs/proposals/pwa-offline.md`

### DEC-044 Form Builder Field Details Use Supporting Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Form Builder field catalog, palette registry, conditional rules, grid/view settings, and scope boundaries now live in `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` as a supporting frontend contract. The main Form Builder module contract remains the first active read; older field/catalog detail docs are exact-detail sources only.
- Sources:
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/README.md`
  - `maestro/memory/docs/frontend/platform-studio/doc-map.md`

### DEC-045 Old Form Builder Detail Docs Use Local Triage Before Reads

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Old Form Builder detail/workstream docs under `platform/frontend/docs/platform-studio/` must be routed through `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md` before reading. The triage classifies them as deleted compatibility pointers, exact-detail references, future proposals, archive candidates, or reference-only donor material.
- Sources:
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - `maestro/memory/docs/frontend/platform-studio/doc-map.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

### DEC-046 Reference Code Uses Stable Aliases Before Physical Relocation

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Raw donor/legacy packs are addressed by stable `reference-pack:*` aliases and moved out of active FE/BE docs paths into ignored local `reference-code/` raw-pack storage. The tracked registry is `maestro/memory/reference-code/README.md`; local memory keeps the pack index and relocation plan.
- Sources:
  - `maestro/memory/reference-code/README.md`
  - `maestro/memory/reference-code/packs-index.md`
  - `maestro/memory/reference-code/relocation-plan.md`
  - `maestro/memory/durable/reference-code-policy.md`

### DEC-047 Old Form Builder Archive And Future Workstream Docs Are Deleted

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Old Form Builder prompt, task, archive, and future workstream pointer docs under `platform/frontend/docs/platform-studio/` are no longer active read-path content and were deleted after compaction. Retained exact-detail reference docs remain for payload/settings audit.
- Sources:
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - git history for exact deleted pointer text

### DEC-048 Old Form Builder Exact-Detail Docs Declare Non-Hot Status

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Retained old Form Builder exact-detail docs under `platform/frontend/docs/platform-studio/` keep their historical payload/settings content, but their tracked headers now declare `Status: exact detail reference` and point readers to the active Form Builder module docs first.

### DEC-049 Form Builder Exact-Detail Docs Require Extraction Before Deletion

- Date: 2026-04-25
- Status: superseded
- State: superseded by DEC-065 and DEC-066 for extraction deletion waves
- Decision: The retained Form Builder exact-detail docs are payload-bearing and must not be mass-deleted. Future deletion requires updating the consolidation audit extraction target and verifying code/schema coverage.
- Sources:
  - `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md`
  - `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`
  - `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md`
  - `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md`
  - `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`

### DEC-049B Backend Operational, Proposal, And Import Docs Use Target Folders

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Backend operational docs now live under `platform/backend/docs/runbooks/`, future gateway/KMS docs live under `platform/backend/docs/proposals/`, and legacy import mapping/boundary docs live under `platform/backend/docs/reference/`. Old root/auth pointer paths were later deleted.
- Sources:
  - `platform/backend/docs/runbooks/local-bootstrap.md`
  - `platform/backend/docs/runbooks/auth-key-sources.md`
  - `platform/backend/docs/runbooks/db-instance-secret-resolution.md`
  - `platform/backend/docs/proposals/kms-signing.md`
  - `platform/backend/docs/proposals/api-gateway-http-api-mapping.md`
  - `platform/backend/docs/proposals/api-gateway-proxy-routing.md`
  - `platform/backend/docs/reference/import-field-mapping.md`
  - `platform/backend/docs/reference/tenant-import-boundary.md`

### DEC-050 Backend Events, Drift, And Historical Docs Use Target Folders

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Backend event actor identity now lives under `platform/backend/docs/contracts/`; events/mail cleanup and schema drift checks live under `platform/backend/docs/proposals/`; completed plans, old standards, and prompt artifacts live under `platform/backend/`. Old root pointer paths were later deleted.
- Sources:
  - `platform/backend/docs/contracts/events-identity.md`
  - `platform/backend/docs/proposals/events-mails-cleanup.md`
  - `platform/backend/docs/proposals/schema-drift-checks.md`
  - `platform/backend/README.md`

### DEC-051 Legacy PostgreSQL SQL Is Archive-Only

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Legacy PostgreSQL SQL is archive/reference material only. The payload now lives under `platform/backend/docs/archive/postgres-archive/`, the old `platform/backend/docs/legacy/postgres-archive/README.md` path is a compatibility pointer, and agents must read active schema/migration contracts before opening archived SQL.
- Sources:
  - `platform/backend/docs/archive/postgres-archive/README.md`
  - `platform/backend/docs/legacy/postgres-archive/README.md`
  - `platform/backend/docs/contracts/migrations.md`
  - `platform/backend/docs/contracts/schema-tenancy.md`

### DEC-052 Backend Active Docs Use Target-Folder Read Order

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Active backend docs must route readers through target folders: `contracts/`, `modules/`, `runbooks/`, `proposals/`, `reference/`, and `archive/`. Old root backend pointer docs were later deleted and must not be described as active read-order or ownership sources.
- Sources:
  - `platform/backend/docs/README.md`
  - `platform/backend/docs/contracts/runtime-wiring.md`
  - `platform/backend/docs/modules/runtime.md`
  - `platform/backend/docs/proposals/events-mails-cleanup.md`
  - `platform/backend/docs/contracts/platform-studio-form-builder.md`

### DEC-053 Frontend Active Docs Use Target-Folder Read Order

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Active frontend docs must route readers through target folders: `contracts/`, `modules/`, `guides/`, `proposals/`, and reference/archive metadata. Old root and `platform-studio/**` docs may remain as compatibility, exact-detail, archive, or reference-only inputs, but they must not be described as active read-order or ownership sources.
- Sources:
  - `platform/frontend/docs/README.md`
  - `platform/frontend/docs/contracts/workspace.md`
  - `platform/frontend/docs/contracts/ui-kit.md`
  - `platform/frontend/docs/modules/platform-studio/README.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

### DEC-054 FE/BE Indexes And Memory Routes Do Not Promote Old Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Tracked frontend/backend docs indexes and local `maestro/memory/index/*` routes must not promote old root docs or old `platform/docs/ai/**` memory as active ownership. Old FE/BE root pointer docs were later deleted; old platform memory is historical import material behind `maestro/memory/durable/legacy-memory-import.md`.
- Sources:
  - `platform/frontend/docs/README.md`
  - `platform/backend/docs/README.md`
  - `maestro/memory/index/memory-index.yaml`
  - `maestro/memory/index/read-routes.yaml`
  - `maestro/memory/durable/canonical-docs.md`

### DEC-065 Form Builder Low-Risk Exact Details Extracted

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The low-risk Form Builder exact-detail docs for advanced fields, content nodes, field rules, grid columns, and checklist subforms were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` and deleted. These files are no longer tracked read targets; exact old text is git-history only. Retained exact-detail docs still require the consolidation audit before any future deletion.
- Sources:
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - git history

### DEC-066 Form Builder Preset Exact Details Extracted

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Form Builder exact-detail docs for choice fields, ready-made fields, and `suggest_text` were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` and deleted. These files are no longer tracked read targets; exact old text is git-history only. The remaining extraction target at this decision point was `form-builder-schema-scope-contract.md`; it is now closed by DEC-067.
- Sources:
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - git history

### DEC-067 Form Builder Schema Scope Exact Detail Extracted

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md` was compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` and deleted. The compact contract now owns builder document shape, root/subform scope ownership, root-only concerns, allowed subform concerns, Section placement, and DEFAULT/CHECKLIST runtime boundaries. The Form Builder exact-detail audit now has no `compact_more_then_delete` entries.
- Sources:
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - git history

### DEC-068 Form Builder Retained Exact-Detail Policy

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The remaining 14 Form Builder exact-detail files under `platform/frontend/docs/platform-studio/` are policy-kept opt-in references. They are not active ownership docs and are not near-term deletion backlog. Future deletion requires equivalent coverage in active compact docs plus code-backed docs, typed schemas, tests, or generated registries, and the consolidation audit must be updated in the same change.
- Sources:
  - `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

### DEC-069 Reference Pointer Dirs Deleted And Docs Memory Check Added

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Old reference-code pointer README folders under `platform/frontend/docs/**` and `platform/backend/docs/**` are deleted instead of retained as compatibility shells. Tracked docs must use `reference-pack:*` aliases plus `maestro/memory/reference-code/README.md`; raw packs remain local-only under `reference-code/**`. Docs/memory drift is now checked by `scripts/checks/docs_memory_check.py --check`.
- Sources:
  - `maestro/memory/reference-code/README.md`
  - `maestro/memory/reference-code/packs-index.md`
  - `maestro/memory/reference-code/relocation-checkpoint.md`
  - `scripts/checks/docs_memory_check.py`

### DEC-070 Docs Memory Drift Runs In CI

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Docs/memory drift verification is now a tracked GitHub Actions gate. `.github/workflows/docs-memory-check.yml` runs `scripts/checks/docs_memory_check.py --check` and `scripts/checks/check_env_policy.py --check` for relevant PRs and pushes to `develop` or `main`.
- Sources:
  - `.github/workflows/docs-memory-check.yml`
  - `scripts/checks/docs_memory_check.py`
  - `scripts/checks/check_env_policy.py`

### DEC-072 Form Builder Exact-Detail Replacement Is Owner-Gated

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The 14 retained Form Builder exact-detail docs remain tracked opt-in references until a future implementation slice explicitly names the replacement target and verification method. The replacement roadmap is docs-only and does not authorize product-code changes by itself.
- Sources:
  - `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-replacement-roadmap.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
  - `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`

### DEC-074 Form Builder Planned Work Stays Separate From Implemented Truth

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Form Builder planned/open work must be compacted separately from implemented/code-confirmed truth. Agents must not treat import, runtime grants, preview guards, runtime create/edit/save records, non-lookup multivalue storage, package extraction, or exact-detail replacement as implemented unless a future code-backed slice lands.
- Sources:
  - `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/backend/docs/contracts/platform-studio-form-builder.md`
