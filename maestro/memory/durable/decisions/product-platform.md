# Product Platform Decisions

Status: durable decision topic
Last compacted: 2026-05-01
Index: `maestro/memory/durable/decisions-log.md`

## Purpose

Active product/platform architecture, product-domain boundaries, delivery assumptions, and local product evidence policies.

## Rules

- Decision IDs are stable and must not be renumbered.
- Preserve deleted-path sources as provenance when they explain history.
- Prefer current canonical docs or compact memory routes for active reads.
- Add new decisions through `maestro/memory/durable/decisions-log.md` first, then place details in the relevant topic file.

## Decisions

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

### DEC-023 Current App Delivery Is Online Web First

- Date: 2026-04-25
- Status: active
- State: accepted
- Decision: Current applications are online web applications. Offline PWA and Flutter/hybrid mobile delivery are future layers after the main web platform stabilizes. Agents must not treat PWA/offline references as active implementation scope without explicit owner activation.
- Sources:
  - Owner clarification in current memory-building session
  - `maestro/memory/docs/target-docs-structure.md`

### DEC-079 Local Dev Domains Use `.localhost`

- Date: 2026-04-26
- Status: active
- State: landed
- Decision: Frontend/backend local dev HTTPS domains use `.platform.localhost` instead of `.platform.local`. This avoids macOS `.local` mDNS/Bonjour resolver stalls while preserving same-site browser routing through Caddy. `pnpm dev:hosts` is kept as a compatibility no-op because `.localhost` does not require `/etc/hosts`.
- Sources:
  - `platform/frontend/dev/caddy/Caddyfile`
  - `platform/frontend/dev/caddy/Caddyfile.high-port`
  - `platform/frontend/docs/guides/local-dev.md`
  - `platform/backend/seeds/local/010_master_seed.sql`

### DEC-085 Product Identity Is VSM v1.0.0

- Date: 2026-04-28
- Status: active
- State: landed
- Decision: The current product identity is VSM (Virtual Safety Manager) v1.0.0. `Ramp Platform v108` is a historical working name only and must not be used as current product identity in active docs, prompts, skills, scripts, or memory. retired runtime is now invoked as `$maestro`; the old `$ramp-conductor` invocation and `.agents/skills/ramp-conductor/` path are retired. Backend local database names such as `108-master`, `108-sandbox`, and `108-demo` are technical local-environment identifiers and are not renamed by this product-identity decision.
- Sources:
  - `README.md`
  - `platform/README.md`
  - `AGENTS.md`
  - `maestro/memory/START_HERE.md`
  - `scripts/checks/docs_memory_check.py`

### DEC-087 Lightweight Storybook And Local Visual Smoke

- Date: 2026-04-28
- Status: active
- State: landed
- Decision: Storybook V1 is a lightweight manual/local visual review loop under `platform/frontend/.storybook`, starting with stable `ui-kit` actions, form controls, feedback, state patterns, table primitives, and `CollectionTable` states (`empty`, `loading`, `ready with rows`, `error`, `filters open`). It is not a CI visual gate until baselines and screenshot policy are explicitly accepted. Browser Use is the default structured in-Codex browser surface for local route/state smoke and evidence. Computer Use with external Chrome is available for final desktop visual/UX acceptance when Codex width or browser context could bias judgment. Owner-provided local login data must live only in ignored `maestro/memory/local/browser-use-auth.md`, and tracked evidence must not record local auth codes.
- Sources:
  - `platform/frontend/.storybook/`
  - `platform/frontend/packages/ui-kit/src/stories/`
  - `platform/frontend/packages/collection-table/src/collection-table.stories.tsx`
  - `platform/frontend/AGENTS.md`
  - `platform/frontend/docs/contracts/ui-kit.md`
  - `platform/frontend/docs/contracts/collection-table.md`
  - `maestro/docs/runtime-contract.md`
  - `maestro/docs/agent-selection-thresholds.md`
  - `.gitignore`

### DEC-098 Business Tree Is A Tenant App Page

- Date: 2026-05-06
- Status: active
- State: owner-confirmed
- Decision: Business Tree is a tenant app page, not a product module. Product
  modules are broader product areas such as future Training or Task Manager.
  Navigation Builder must distinguish app page targets from product module
  targets, and should be able to register `/app/pages/business-tree` as an app
  page target without treating it as a whole module.
- Sources:
  - Owner clarification in current Business Tree implementation session
  - `platform/frontend/apps/tenant-web/src/features/app-pages/business-tree`
  - `platform/backend/modules/tenant/apppages/businesstree`

### DEC-099 Form Builder View Activity Is Navigation-Owned

- Date: 2026-05-06
- Status: active
- State: owner-confirmed
- Decision: Form Builder does not own View Active/Inactive or runtime/sidebar
  exposure. `isActive` is retired from Form Builder view config and new
  `ps_view.definition_json` payloads. Older payloads may be tolerated and
  dropped on load/save. The backend `ps_view.is_active` column and API summary
  values remain deprecated compatibility metadata until a later cleanup.
  Navigation Builder owns sidebar/runtime exposure for
  `{ targetType: form_builder_view, modelId, viewId }`.
- Follow-up: after Navigation Builder exposure is implemented and verified,
  remove or fully deprecate Form Builder API request/summary `isActive` usage
  and evaluate dropping `ps_view.is_active` in a dedicated migration slice.
- Sources:
  - Owner decision on 2026-05-06
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/backend/docs/contracts/platform-studio-form-builder.md`
  - `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
