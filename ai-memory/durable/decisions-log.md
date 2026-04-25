# Decisions Log

Status: compact durable decisions
Last compacted: 2026-04-25

Use this file for durable decisions only.
Do not turn it into a task journal.

## Active Decisions

### DEC-001 Platform Stays Monorepo And Modular Monolith

- Date: 2026-03-29
- Status: active
- State: landed
- Decision: Keep one monorepo and keep backend as a modular monolith with multiple runtime entrypoints. Do not split into early microservices.
- Rationale: Current platform boundaries need shared tenant/auth/schema contracts and fast cross-stack iteration.
- Sources:
  - `platform/docs/ai/platform-contract.md`
  - `platform/docs/ai/repo-map.md`

### DEC-002 Frontend Is Split By Product Surface

- Date: 2026-03-29
- Status: active
- State: landed
- Decision: Keep `platform-admin-web` and `tenant-web` as separate apps. Do not collapse them into one route-only app.
- Sources:
  - `platform/docs/ai/platform-contract.md`
  - `platform/frontend/docs/app-surfaces.md`

### DEC-003 Migrations Belong To `cmd/migrate`

- Date: 2026-03-29
- Status: active
- State: landed
- Decision: API runtimes must not run schema migrations during startup.
- Sources:
  - `platform/docs/ai/modules/schema-and-tenancy.md`
  - `platform/backend/docs/contracts/migrations.md`

### DEC-004 Tenant-Aware Design Retains `tenant_id`

- Date: 2026-03-29
- Status: active
- State: landed
- Decision: Keep `tenant_id` on tenant-aware application tables even when tenant data lives in dedicated databases.
- Sources:
  - `platform/docs/ai/modules/schema-and-tenancy.md`

### DEC-005 Refresh Token Is Cookie-Only

- Date: 2026-03-30
- Status: active
- State: landed
- Decision: Frontend must not read or store refresh tokens in JavaScript. Refresh/logout use cookie-backed auth endpoints.
- Sources:
  - `platform/docs/ai/modules/auth-and-session.md`
  - `platform/backend/docs/contracts/auth-gateway.md`

### DEC-006 Profile And Navigation Stay Separate

- Date: 2026-03-30
- Status: active
- State: landed
- Decision: `/app/profile` stays profile-only. Admin navigation is projected separately through `GET /app/me/navigation`.
- Sources:
  - `platform/docs/ai/modules/auth-and-session.md`
  - `platform/docs/ai/modules/admin-control-plane.md`

### DEC-007 Module Registry Is Root-Only

- Date: 2026-04-02
- Status: active
- State: landed
- Decision: Module Registry UI and management remain root-only.
- Sources:
  - `platform/docs/ai/modules/admin-module-registry.md`
  - `platform/backend/docs/backend-admin-module-registry-brief.md`

### DEC-008 Non-Root Admin Access Is Section-Level And Allow-Only

- Date: 2026-04-02
- Status: active
- State: landed
- Decision: Non-root admin grants resolve at section level only. The model is allow-only with current access values `read` and `write`.
- Sources:
  - `platform/docs/ai/modules/admin-control-plane.md`
  - `platform/backend/docs/backend-admin-access-policy-layering.md`

### DEC-009 Collection Table Is Separate From Admin Module Registry

- Date: 2026-04-05
- Status: active
- State: landed
- Decision: Collection Table and Admin Module Registry use separate memory domains. Module Registry is a proving/consumer surface, not owner of the generic table contract.
- Sources:
  - `platform/docs/ai/modules/collection-table.md`
  - `platform/docs/ai/modules/admin-module-registry.md`

### DEC-010 Collection Table Package Is Extracted

- Date: 2026-04-06
- Status: active
- State: landed
- Decision: The shared frontend runtime/page host lives in `@platform/collection-table`, currently consumed by Module Registry, Employees, and Tenants in the admin app.
- Sources:
  - `platform/docs/ai/modules/collection-table.md`
  - `platform/docs/ai/current-state.md`
  - `platform/frontend/packages/collection-table`

### DEC-011 Platform Studio Stays Tenant-Web App-Local UI

- Date: 2026-03-30
- Status: active
- State: landed
- Decision: Platform Studio UI stays app-local in `tenant-web`; the shared layer is `@platform/platform-studio-core` for typed non-UI contracts/helpers.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/contracts/platform-studio.md`
  - `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`

### DEC-012 Platform Studio Taxonomy Is Locked

- Date: 2026-04-07
- Status: active
- State: landed
- Decision: `Platform Studio` is the umbrella. `Form Builder` is active. `Navigation Builder`, `Action Builder`, `PDF Builder`, and `Report Builder` are planned tools.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/contracts/platform-studio.md`
  - `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`

### DEC-013 Form Builder Uses Three-Schema Authoring Split

- Date: 2026-04-13
- Status: active
- State: landed
- Decision: `ps_model.definition_json` owns `dataSchema + layoutBlueprint`; `ps_view.definition_json` owns `uiSchema`.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`

### DEC-014 Form Builder Save Is Not Site Publication

- Date: 2026-04-13
- Status: active
- State: landed
- Decision: Form Builder `Save` persists authoring state and may run additive runtime apply, but it is not site publication. Navigation Builder and privileges remain separate exposure layers.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`

### DEC-015 Static/External Form Builder Models Are Root-Only And Views-Only

- Date: 2026-04-16
- Status: active
- State: landed
- Decision: Static/external Form Builder models are visible only to root; schema is read-only even for root; root may manage views.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md`

### DEC-016 Runtime Naming Contract v1.1 Is Accepted

- Date: 2026-04-16
- Status: active
- State: accepted
- Decision: Runtime naming separates logical authoring keys from immutable physical runtime aliases. Accepted prefixes are `ps_` tables, `vw_` canonical views, and `vg_` grid views.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/platform-studio/form-builder-runtime-naming-contract-v1-1.md`

### DEC-017 Managed Export Model Bundle Is Future Import Source

- Date: 2026-04-16
- Status: active
- State: accepted
- Decision: Current `Export model` bundle is the accepted future source for `Import model` of managed models across tenants.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/platform-studio/form-builder-import-bundle-contract-v1.md`

### DEC-018 Runtime Route Strategy Is Per View

- Date: 2026-04-16
- Status: active
- State: accepted
- Decision: Authored Form Builder `view` is the canonical runtime entrypoint. Runtime delivery is per-view, not model-only.
- Sources:
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/platform-studio/form-builder-runtime-view-strategy-v1.md`
  - `platform/frontend/docs/platform-studio/form-builder-runtime-routes-contract-v1.md`

### DEC-019 Codex-Native Runtime Is Current Repo Runtime

- Date: 2026-04-24
- Status: active
- State: landed
- Decision: Root `AGENTS.md`, `.codex/`, `.agents/skills/maestro|charlie|grant`, `.agent-cli/`, and `docs/maestro/module-orchestrator-v2-spec-pack/` define current repo runtime. `ai-memory/` is a local retrieval layer, not a replacement runtime source.
- Sources:
  - `AGENTS.md`
  - `docs/codex-native-repo.md`
  - `.codex/standards/runtime/repository.md`

### DEC-020 Platform Studio Is A Tool Suite, Not Form Builder Alone

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Platform Studio is the larger tool suite for configuring forms, navigation/sidebar, access-facing runtime exposure, actions/events, PDFs, reports, and later tools. Form Builder is only the first active tool. Navigation Builder is expected to own sidebar/navigation composition and may own access/permission assignment unless a later decision splits access into its own tool. Planned tool concerns must not be implemented inside Form Builder by default.
- Sources:
  - Owner clarification in current memory-building session
  - `platform/docs/ai/modules/platform-studio.md`
  - `platform/frontend/docs/contracts/platform-studio.md`
  - `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`

### DEC-021 Backend Docs Use Compact Classification Before Deep Reads

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Backend docs are useful but mixed-status. Agents should read compact backend memory and `ai-memory/docs/backend/doc-map.md` before opening deep tracked backend docs, and should avoid legacy archives, old standards, prompts, proposed gateway plans, and completed refactor plans by default.
- Sources:
  - `platform/backend/docs/README.md`
  - `platform/backend/docs/contracts/runtime-wiring.md`
  - `platform/backend/docs/contracts/auth-gateway.md`
  - `platform/backend/docs/contracts/schema-tenancy.md`
  - `ai-memory/docs/backend/doc-map.md`

### DEC-022 Reference Code Is Opt-In Donor Material

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Reference code such as Metronic should be governed by a local reference-code policy, excluded from the default AI read path, and distilled into product/module memory instead of copied into active docs.
- Sources:
  - Owner clarification in current memory-building session
  - `ai-memory/durable/reference-code-policy.md`
  - `ai-memory/reference-code/README.md`

### DEC-023 Current App Delivery Is Online Web First

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Current applications are online web applications. Offline PWA and Flutter/hybrid mobile delivery are future layers after the main web platform stabilizes. Agents must not treat PWA/offline references as active implementation scope without explicit owner activation.
- Sources:
  - Owner clarification in current memory-building session
  - `ai-memory/docs/target-docs-structure.md`

### DEC-024 FE/BE Docs Rewrite Will Use Contract-First Target Structure

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: The later physical rewrite of `platform/frontend/docs` and `platform/backend/docs` should separate active contracts, module docs, guides/runbooks, proposals, reference material, and archives. No tracked docs are moved during planning.
- Sources:
  - `ai-memory/docs/target-docs-structure.md`
  - `ai-memory/docs/frontend/doc-map.md`
  - `ai-memory/docs/backend/doc-map.md`

### DEC-025 Physical Docs Migration Requires Explicit Source-To-Target Mapping

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Before moving tracked FE/BE docs, use a migration map that records old path, current role, new role, target path, action, reason, and risk/blocker. The migration plan is a planning artifact only until the owner approves a concrete tracked-doc slice.
- Sources:
  - `ai-memory/docs/docs-migration-plan.md`
  - `ai-memory/docs/target-docs-structure.md`

### DEC-026 Frontend Workspace Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The first frontend docs migration slice landed as tracked contract-first docs under `platform/frontend/docs/contracts/` plus proposal scope for PWA/offline under `platform/frontend/docs/proposals/`. Old root workspace doc paths remain compatibility pointers.
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
- Decision: The backend runtime docs migration slice landed as tracked contract-first docs under `platform/backend/docs/contracts/runtime-wiring.md` and `platform/backend/docs/modules/runtime.md`. Old root runtime doc paths remain compatibility pointers.
- Sources:
  - `platform/backend/docs/contracts/runtime-wiring.md`
  - `platform/backend/docs/modules/runtime.md`
  - `platform/backend/docs/README.md`

### DEC-028 Auth Cross-Stack Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The auth cross-stack docs migration slice landed as frontend `platform/frontend/docs/contracts/auth-runtime.md`, backend `platform/backend/docs/contracts/auth-gateway.md`, backend `platform/backend/docs/contracts/auth-control-schema.md`, and backend `platform/backend/docs/modules/auth.md`. Old FE/BE auth doc paths remain compatibility pointers.
- Sources:
  - `platform/frontend/docs/contracts/auth-runtime.md`
  - `platform/backend/docs/contracts/auth-gateway.md`
  - `platform/backend/docs/contracts/auth-control-schema.md`
  - `platform/backend/docs/modules/auth.md`

### DEC-029 Schema And Tenancy Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The schema and tenancy docs migration slice landed as backend `platform/backend/docs/contracts/schema-tenancy.md` and `platform/backend/docs/contracts/migrations.md`. Old schema baseline and tenant canonical refactor doc paths remain compatibility pointers.
- Sources:
  - `platform/backend/docs/contracts/schema-tenancy.md`
  - `platform/backend/docs/contracts/migrations.md`
  - `platform/backend/docs/README.md`

### DEC-030 Admin Control-Plane Docs Use Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The admin control-plane docs migration slice landed as backend `platform/backend/docs/contracts/admin-control-plane.md` and `platform/backend/docs/contracts/admin-module-registry.md`. Old admin Module Registry and access-policy doc paths remain compatibility pointers.
- Sources:
  - `platform/backend/docs/contracts/admin-control-plane.md`
  - `platform/backend/docs/contracts/admin-module-registry.md`
  - `platform/backend/docs/README.md`

### DEC-031 Collection Table Docs Use Cross-Stack Contract-First Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Collection Table docs migration slice landed as frontend `platform/frontend/docs/contracts/collection-table.md` and backend `platform/backend/docs/contracts/collection-table.md`. Old frontend collection-table runtime, backend-integration, and shared-readiness paths remain compatibility pointers.
- Sources:
  - `platform/frontend/docs/contracts/collection-table.md`
  - `platform/backend/docs/contracts/collection-table.md`
  - `platform/frontend/docs/README.md`
  - `platform/backend/docs/README.md`

### DEC-032 Platform Admin Web Docs Use Module Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Platform Admin Web docs migration slice landed as `platform/frontend/docs/modules/platform-admin-web.md`. The old admin Module Registry backend handoff path remains a compatibility pointer and no longer owns admin shell/navigation/favorites context.
- Sources:
  - `platform/frontend/docs/modules/platform-admin-web.md`
  - `platform/frontend/docs/admin-module-registry-backend-handoff.md`
  - `platform/frontend/docs/README.md`

### DEC-033 Platform Studio Suite Docs Use Contract And Module Tracked Paths

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Platform Studio suite boundary slice landed as `platform/frontend/docs/contracts/platform-studio.md` and `platform/frontend/docs/modules/platform-studio/README.md`. The old `platform/frontend/docs/platform-studio/README.md` and `platform/frontend/docs/platform-studio/taxonomy-and-naming.md` paths remain compatibility pointers and no longer own the suite-level read path.
- Sources:
  - `platform/frontend/docs/contracts/platform-studio.md`
  - `platform/frontend/docs/modules/platform-studio/README.md`
  - `platform/frontend/docs/platform-studio/README.md`
  - `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`

### DEC-034 Form Builder Docs Use Module Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The Form Builder docs migration slice landed as `platform/frontend/docs/modules/platform-studio/form-builder.md`. The old hot Form Builder source docs under `platform/frontend/docs/platform-studio/form-builder-*.md` now remain compatibility pointers for historical/audit detail and no longer own the active Form Builder read path.
- Sources:
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/README.md`
  - `platform/frontend/docs/README.md`

### DEC-035 Backend Form Builder Docs Use Backend Contract Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Backend-owned Form Builder API, storage, validation, generated-object, and runtime apply facts now live in `platform/backend/docs/contracts/platform-studio-form-builder.md`. Old frontend backend-facing Form Builder docs remain compatibility pointers and must not be used as the active backend source of truth.
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
- Decision: UI Kit governance now lives in `platform/frontend/docs/contracts/ui-kit.md`. The old UI delivery order, layout baseline, boundary audit, and stable approved audit paths remain compatibility pointers and no longer own the active UI read path.
- Sources:
  - `platform/frontend/docs/contracts/ui-kit.md`
  - `platform/frontend/docs/README.md`
  - `platform/frontend/packages/ui-kit/README.md`

### DEC-038 UI Lab Docs Use Guide Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: UI Lab route, section model, review coverage, and editing rules now live in `platform/frontend/docs/guides/ui-lab.md`. The old UI Lab structure and UI Kit coverage inventory paths remain compatibility pointers and no longer own the active UI Lab read path.
- Sources:
  - `platform/frontend/docs/guides/ui-lab.md`
  - `platform/frontend/docs/ui-lab-structure.md`
  - `platform/frontend/docs/ui-lab-ui-kit-coverage.md`
  - `platform/frontend/docs/README.md`

### DEC-039 Deferred Composed UI Surfaces Stay Proposal Scope

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Deferred workflow-shaped frontend surfaces now live in `platform/frontend/docs/proposals/deferred-composed-surfaces.md`. Remote table workspaces, file upload workspace, AI assistant dialog, full-screen messenger, and kanban task board remain future/app-layer-first scope until explicitly activated; they must not be promoted wholesale into UI Lab or UI Kit.
- Sources:
  - `platform/frontend/docs/proposals/deferred-composed-surfaces.md`
  - `platform/frontend/docs/deferred-composed-surfaces.md`
  - `platform/frontend/docs/README.md`

### DEC-040 Frontend Foundation History Is Archived

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: The frontend foundation rollout and Phase E gap review are closed history. Durable lessons now live in `platform/frontend/docs/contracts/ui-kit.md` and `platform/frontend/docs/guides/ui-lab.md`; old `foundation-rollout-plan.md` and `phase-e-gap-review.md` paths remain archive compatibility pointers and must not drive active shared-component work.
- Sources:
  - `platform/frontend/docs/contracts/ui-kit.md`
  - `platform/frontend/docs/guides/ui-lab.md`
  - `platform/frontend/docs/foundation-rollout-plan.md`
  - `platform/frontend/docs/phase-e-gap-review.md`

### DEC-041 Install Helper Docs Use Guide Tracked Path

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Current frontend install prompt/runtime behavior now lives in `platform/frontend/docs/guides/install-helper.md`. The old `install-helper-runtime.md` path remains a compatibility pointer. Install helper is active for public auth install prompting, but it does not activate service-worker, offline-first, local sync, or Flutter/hybrid mobile scope.
- Sources:
  - `platform/frontend/docs/guides/install-helper.md`
  - `platform/frontend/docs/install-helper-runtime.md`
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
  - `ai-memory/docs/frontend/platform-studio/doc-map.md`

### DEC-045 Old Form Builder Detail Docs Use Local Triage Before Reads

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Old Form Builder detail/workstream docs under `platform/frontend/docs/platform-studio/` must be routed through `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md` before reading. The triage classifies them as compatibility pointers, exact-detail references, future proposals, archive candidates, or reference-only donor material.
- Sources:
  - `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
  - `ai-memory/docs/frontend/platform-studio/doc-map.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

### DEC-046 Reference Code Uses Stable Aliases Before Physical Relocation

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Raw donor/legacy packs are addressed by stable `reference-pack:*` aliases and moved out of active FE/BE docs paths into ignored local `reference-code/` raw-pack storage. The tracked registry is `docs/ref/reference-code.md`; local memory keeps the pack index and relocation plan.
- Sources:
  - `docs/ref/reference-code.md`
  - `ai-memory/reference-code/packs-index.md`
  - `ai-memory/reference-code/relocation-plan.md`
  - `ai-memory/durable/reference-code-policy.md`

### DEC-047 Old Form Builder Archive And Future Workstream Docs Are Pointer Stubs

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Old Form Builder prompt, task, archive, and future workstream docs under `platform/frontend/docs/platform-studio/` are no longer active read-path content. Their tracked files are short archive or future proposal pointer stubs. Exact-detail reference docs remain intact for payload/settings audit.
- Sources:
  - `platform/frontend/docs/platform-studio/agent-prompts.md`
  - `platform/frontend/docs/platform-studio/form-builder-implementation-backlog.md`
  - `platform/frontend/docs/platform-studio/form-builder-multivalue-storage-contract.md`
  - `platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md`
  - `platform/frontend/docs/platform-studio/form-builder-rich-text-editor-workstream-contract.md`
  - `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`

### DEC-048 Old Form Builder Exact-Detail Docs Declare Non-Hot Status

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Retained old Form Builder exact-detail docs under `platform/frontend/docs/platform-studio/` keep their historical payload/settings content, but their tracked headers now declare `Status: exact detail reference` and point readers to the active Form Builder module docs first.
- Sources:
  - `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md`
  - `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`
  - `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md`
  - `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md`
  - `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
  - `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`

### DEC-049 Backend Operational, Proposal, And Import Docs Use Target Folders

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Backend operational docs now live under `platform/backend/docs/runbooks/`, future gateway/KMS docs live under `platform/backend/docs/proposals/`, and legacy import mapping/boundary docs live under `platform/backend/docs/reference/`. Old root/auth paths are compatibility pointers.
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
- Decision: Backend event actor identity now lives under `platform/backend/docs/contracts/`; events/mail cleanup and schema drift checks live under `platform/backend/docs/proposals/`; completed plans, old standards, and prompt artifacts live under `platform/backend/docs/archive/`. Old root paths are compatibility or archive pointers.
- Sources:
  - `platform/backend/docs/contracts/events-identity.md`
  - `platform/backend/docs/proposals/events-mails-cleanup.md`
  - `platform/backend/docs/proposals/schema-drift-checks.md`
  - `platform/backend/docs/archive/README.md`

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
- Decision: Active backend docs must route readers through target folders: `contracts/`, `modules/`, `runbooks/`, `proposals/`, `reference/`, and `archive/`. Old root backend docs may remain as compatibility pointers, but they must not be described as active read-order or ownership sources.
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
- Decision: Tracked frontend/backend docs indexes and local `ai-memory/index/*` routes must not promote old root docs or old `platform/docs/ai/**` memory as active ownership. Old FE/BE root docs remain compatibility pointers; old platform memory is historical import material behind `ai-memory/durable/legacy-memory-import.md`.
- Sources:
  - `platform/frontend/docs/README.md`
  - `platform/backend/docs/README.md`
  - `ai-memory/index/memory-index.yaml`
  - `ai-memory/index/read-routes.yaml`
  - `ai-memory/durable/canonical-docs.md`

### DEC-055 Atlas Workflow Uses Ai-Memory Operational Layer

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: Atlas/ramp-conductor now uses `ai-memory` as the first retrieval layer, active prompt/template/version metadata under `ai-memory/atlas`, and run artifacts under `ai-memory/runs/active`. Old `platform/docs/ai/**` is legacy provenance only until final retirement.
- Sources:
  - `platform/AGENTS.md`
  - `platform/backend/AGENTS.md`
  - `platform/frontend/AGENTS.md`
  - `.agents/skills/ramp-conductor/SKILL.md`
  - `ai-memory/atlas/README.md`
  - `ai-memory/atlas/migration-audit.md`
  - `scripts/ai/new-run.py`
  - `scripts/ai/automation_versions.py`

### DEC-056 Docs Ref And Legacy Platform AI Use Archive/Retirement Boundaries

- Date: 2026-04-25
- Status: active
- State: landed
- Decision: `docs/ref/` is reserved for stable opt-in reference registries. Memory reorganization prompts and blueprints moved to `docs/archive/memory-reorg/`. `platform/docs/ai/**` remains legacy provenance only; its top-level, prompt, template, and run indexes are retired pointers, and final deletion must follow the retirement plan.
- Sources:
  - `docs/ref/README.md`
  - `docs/archive/memory-reorg/README.md`
  - `platform/docs/ai/README.md`
  - `platform/docs/ai/prompts/README.md`
  - `platform/docs/ai/templates/README.md`
  - `platform/docs/ai/runs/README.md`
  - `ai-memory/atlas/platform-docs-ai-retirement-plan.md`
