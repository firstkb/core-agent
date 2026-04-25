# Target Docs Structure

Status: future physical rewrite plan
Last compacted: 2026-04-25

This is the target structure for a later rewrite of `platform/frontend/docs` and `platform/backend/docs`.
No tracked files are moved by this plan.

Migration progress:

- Frontend workspace slice landed: `contracts/workspace.md`, `contracts/app-surfaces.md`, `contracts/package-boundaries.md`, `contracts/tenant-model.md`, and `proposals/pwa-offline.md` exist in tracked docs.
- Backend runtime slice landed: `contracts/runtime-wiring.md` and `modules/runtime.md` exist in tracked docs.
- Auth cross-stack slice landed: frontend `contracts/auth-runtime.md`, backend `contracts/auth-gateway.md`, backend `contracts/auth-control-schema.md`, and backend `modules/auth.md` exist in tracked docs.
- Schema and tenancy slice landed: backend `contracts/schema-tenancy.md` and `contracts/migrations.md` exist in tracked docs.
- Admin control-plane slice landed: backend `contracts/admin-control-plane.md` and `contracts/admin-module-registry.md` exist in tracked docs.
- Collection Table slice landed: frontend `contracts/collection-table.md` and backend `contracts/collection-table.md` exist in tracked docs.
- Platform Admin Web slice landed: frontend `modules/platform-admin-web.md` exists in tracked docs.
- Platform Studio suite boundary slice landed: frontend `contracts/platform-studio.md` and `modules/platform-studio/README.md` exist in tracked docs.
- Form Builder contract slice landed: frontend `modules/platform-studio/form-builder.md` exists in tracked docs.
- Platform Studio supporting field/catalog slice landed: frontend `modules/platform-studio/form-builder-fields.md` exists in tracked docs.
- Backend Form Builder contract slice landed: backend `contracts/platform-studio-form-builder.md` exists in tracked docs.
- Backend Form Builder module doc slice landed: backend `modules/platform-studio/form-builder.md` exists in tracked docs.
- UI Kit contract slice landed: frontend `contracts/ui-kit.md` exists in tracked docs.
- UI Lab guide slice landed: frontend `guides/ui-lab.md` exists in tracked docs.
- Deferred composed surfaces proposal slice landed: frontend `proposals/deferred-composed-surfaces.md` exists in tracked docs.
- Frontend closed UI history archive slice landed: `foundation-rollout-plan.md` and `phase-e-gap-review.md` are archive compatibility pointers.
- Install helper guide slice landed: frontend `guides/install-helper.md` exists in tracked docs.
- Frontend local dev guide slice landed: frontend `guides/local-dev.md` exists in tracked docs.
- Tenant Web module doc slice landed: frontend `modules/tenant-web.md` exists in tracked docs.
- Remaining Form Builder detail triage landed locally at `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`.
- Reference-code alias registry and relocation landed for raw donor/legacy packs.

## Goals

- Make active contracts easy for agents to find in one pass.
- Separate active contracts, guides, proposals, reference material, and archive material.
- Remove duplicate or stale plan-shaped docs from the hot read path.
- Keep FE and BE docs symmetrical enough that cross-stack modules are easy to trace.
- Keep local `ai-memory` as the retrieval layer, not as the tracked product docs replacement.

## Global Rules

- Every active doc starts with `Status`, `Owner`, `Last audited`, and `Canonical scope`.
- Every active doc states what it supersedes when relevant.
- Active docs use repo-relative links only.
- Active docs should name their source-of-truth boundary explicitly.
- Plans and audits must not look like contracts after they are completed.
- Reference code metadata belongs outside active FE/BE docs.
- Large donor/vendor trees must not live in active docs paths.
- Raw donor/legacy packs should be cited through `reference-pack:*` aliases and stay in local/private raw-pack storage.

## Product App Strategy

- Current applications are online web applications.
- `platform-admin-web` and `tenant-web` are the active frontend applications.
- Offline PWA and Flutter/hybrid mobile are future delivery layers after the main web platform stabilizes.
- Existing PWA references must be read as future/deferred unless a later owner decision activates that work.
- Agents must not introduce offline-first architecture, service-worker caching, local sync, or mobile shell assumptions into current implementation tasks without explicit approval.

## Target Frontend Docs

```text
platform/frontend/docs/
  README.md
  contracts/
    workspace.md
    app-surfaces.md
    package-boundaries.md
    tenant-model.md
    auth-runtime.md
    collection-table.md
    ui-kit.md
    platform-studio.md
  modules/
    platform-admin-web.md
    tenant-web.md
    platform-studio/
      README.md
      form-builder.md
      form-builder-fields.md
      navigation-builder.md
      action-builder.md
      pdf-builder.md
      report-builder.md
  guides/
    local-dev.md
    testing.md
    adding-frontend-package.md
    ui-lab.md
  proposals/
    pwa-offline.md
    flutter-hybrid-mobile.md
    deferred-composed-surfaces.md
  reference/
    README.md
    vendor/
      README.md
    platform-studio/
      README.md
  archive/
    README.md
    platform-studio/
      README.md
```

### Frontend Active Contracts

- `contracts/workspace.md`: app/package layout, tooling, package ownership.
- `contracts/app-surfaces.md`: current online web apps and route ownership.
- `contracts/package-boundaries.md`: app-to-package dependency rules and public entrypoints.
- `contracts/tenant-model.md`: frontend tenant runtime assumptions.
- `contracts/auth-runtime.md`: access token state, cookie refresh, bootstrap recovery.
- `contracts/collection-table.md`: `@platform/collection-table` runtime contract and host boundaries.
- `contracts/ui-kit.md`: stable UI primitives, promotion rules, design-token usage.
- `contracts/platform-studio.md`: umbrella suite boundary and tool ownership.

### Frontend Module Docs

- `modules/platform-admin-web.md`: admin shell, root/non-root admin flows, Module Registry, Employees, and Tenants surfaces.
- `modules/tenant-web.md`: tenant shell and online tenant app behavior.
- `modules/platform-studio/README.md`: suite-level navigation for Platform Studio docs.
- `modules/platform-studio/form-builder.md`: active Form Builder implementation contract.
- `modules/platform-studio/form-builder-fields.md`: supporting Form Builder field catalog, palette registry, rules, grid/view settings, and scope boundaries.
- `modules/platform-studio/navigation-builder.md`: planned navigation/sidebar/access-facing tool boundary.
- `modules/platform-studio/action-builder.md`: planned authored events/actions/notifications boundary.
- `modules/platform-studio/pdf-builder.md`: planned PDF configuration boundary.
- `modules/platform-studio/report-builder.md`: planned report configuration boundary.

### Frontend Archive Targets

Move only after durable outcomes are captured:

- old workstream plans
- prompt artifacts
- outdated package-extraction plans
- stale auth follow-ups
- `metronic/**` raw vendor material
- `vendor/**` raw vendor material
- `platform-studio/old-code-reference/**`

## Target Backend Docs

```text
platform/backend/docs/
  README.md
  contracts/
    runtime-wiring.md
    auth-gateway.md
    auth-control-schema.md
    schema-tenancy.md
    migrations.md
    collection-table.md
    admin-control-plane.md
    admin-module-registry.md
    events-identity.md
    platform-studio-form-builder.md
  modules/
    runtime.md
    auth.md
    admin.md
    tenant.md
    migrations.md
    platform-studio/
      form-builder.md
  runbooks/
    local-bootstrap.md
    auth-key-sources.md
    db-instance-secret-resolution.md
  proposals/
    api-gateway-http-api-mapping.md
    api-gateway-proxy-routing.md
    schema-drift-checks.md
    kms-signing.md
    events-mails-cleanup.md
  reference/
    import-field-mapping.md
    tenant-import-boundary.md
  archive/
    README.md
```

### Backend Active Contracts

- `contracts/runtime-wiring.md`: `cmd/<app>/internal/server` composition, bootstrap, wiring, and routes.
- `contracts/auth-gateway.md`: JWT, JWKS, trusted headers, gateway-first validation target.
- `contracts/auth-control-schema.md`: master auth/control tables and refresh/session fields.
- `contracts/schema-tenancy.md`: master vs tenant DB placement and canonical naming.
- `contracts/migrations.md`: `cmd/migrate`, master/tenant migrations, tenant bundle.
- `contracts/collection-table.md`: shared backend collection-table DTOs, validators, preferences, and current admin collection surfaces.
- `contracts/admin-control-plane.md`: root/non-root admin access, profile/navigation split.
- `contracts/admin-module-registry.md`: root-only registry, section grants, registry routes.
- `contracts/events-identity.md`: event actor identity and event attribution.
- `contracts/platform-studio-form-builder.md`: backend authoring/runtime apply boundary for Form Builder.

### Backend Module Docs

- `modules/runtime.md`: backend entrypoints and shared runtime composition.
- `modules/auth.md`: auth module behavior and boundaries.
- `modules/admin.md`: admin modules, grants, tenants, employees.
- `modules/tenant.md`: tenant-facing module conventions.
- `modules/migrations.md`: migration runtime and generated bundle.
- `modules/platform-studio/form-builder.md`: tenant Form Builder backend module.

### Backend Archive Targets

Move only after durable outcomes are captured:

- completed Module Registry refactor plan
- old Go agent rules
- old large backend standard
- prompt artifacts
- superseded tenant starter field notes
- legacy PostgreSQL archive
- completed cookie migration plan after final current auth contract is rewritten

## Reference Code Strategy

Reference code should not be physically stored inside active FE/BE docs.
Use one of these:

- local ignored `reference-code/**` for local-only raw packs
- a separate private reference repository synchronized outside this repo
- tracked `docs/ref/**` metadata without raw bulky donor trees

Each reference pack needs metadata for origin, license, status, allowed use, forbidden use, owner modules, and distilled outputs.

Stable tracked alias registry:

- `docs/ref/reference-code.md`

Current aliases:

- `reference-pack:metronic`
- `reference-pack:extdb-legacy`
- `reference-pack:ezform-prototype`
- `reference-pack:smartapp-runtime`
- `reference-pack:old-builder-reference`
- `reference-pack:mssql-legacy-schema`

## Rewrite Sequence

1. Freeze compact memory for the target slice.
2. Rewrite one active contract at a time into the target structure.
3. Add a small source mapping from old tracked docs to the new doc.
4. Move old docs into `archive/` only after their durable facts are captured.
5. Update `ai-memory/docs/*/doc-map.md` and `ai-memory/durable/canonical-docs.md`.
6. Update agent read routing only after the tracked rewrite lands.

## Open Strategy Questions

- Whether access assignment stays inside Navigation Builder or becomes a separate Access Builder.
- Whether PWA and Flutter/mobile share one future proposal doc or separate delivery contracts when activated.
- Whether raw reference packs should be mirrored locally under `reference-code/**` after the separate private reference repository exists.
