# Platform Builder V1 Implementation Backlog

## Iteration Goal

Turn the accepted Platform Builder architecture into a concrete V1 implementation plan for the current `platform/frontend` monorepo.

This iteration should produce the smallest end-to-end slice that proves all of the following:

- Builder UI lives inside `tenant-web`, not `platform-admin-web`.
- Builder state is expressed through typed metadata contracts, not overloaded field objects.
- Builder preview and tenant runtime both resolve the same published-manifest shape.
- Runtime tenant routes read only published metadata, never live draft state.

The accepted architecture and scope decisions are already fixed in:

- [decision.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/decision.md)
- [legacy-lineage.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/legacy-lineage.md)
- [info1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/info1.md)
- [info2.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-builder/info2.md)

This document only turns those decisions into an implementation backlog grounded in the current frontend workspace.

## Current Repo Boundaries And Integration Points

### Confirmed ownership boundaries

- `tenant-web` owns tenant-scoped runtime behavior and tenant-specific navigation, which matches the decision to host Platform Builder there: [app-surfaces.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/app-surfaces.md#L25)
- `tenant-core` is the home for shared tenant context and permission mapping, while route-level behavior should remain app-local until it becomes a real shared contract: [tenant-model.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/tenant-model.md#L19)
- frontend package rules still apply: export through `src/index.ts`, avoid deep imports, and keep screen-specific workflow composition in app code until stabilized: [package-boundaries.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/package-boundaries.md#L15)

### Observed code reality in `platform/frontend`

- `tenant-web` currently has only one protected route, `/dashboard`, so Builder routes do not exist yet: [app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx#L191)
- `tenant-web` expects app-local features to live under `src/features`, but the folder is not populated yet: [src/README.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/README.md#L3)
- `PrivateApp` wires shell navigation to dashboard scroll callbacks rather than route-based navigation, so Builder cannot be added only by appending links: [private-app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/private-app.tsx#L117)
- tenant navigation is still a single hardcoded dashboard item: [navigation.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/shared/navigation.ts#L8)
- `WorkspaceShell` accepts a flat `WorkspaceNavItem[]` and internally maps it to a flat `SidebarNavItem[]`, so Builder navigation tree support needs either a local adapter or a later shell contract upgrade: [workspace-shell.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/workspace-shell.tsx#L25), [workspace-shell.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/workspace-shell.tsx#L299)
- `forms` is not a schema renderer yet; it only exposes field help/error helpers: [forms/src/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/forms/src/index.ts#L1)
- `api-client` currently exposes only a health request, so Builder draft/publish/profile clients do not exist yet: [api-client/src/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/api-client/src/index.ts#L1)
- `auth-core` gives auth state, tokens, and `userId`, but it does not expose Builder capabilities or reusable role claims yet: [auth-provider.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/auth-provider.tsx#L35), [auth-core/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/index.ts#L1)
- `tenant-core` is still demo-oriented and does not yet provide the runtime permission/context surface that Access Builder will eventually need: [tenant-core/src/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/tenant-core/src/index.ts#L1)
- `tenant-web` already bootstraps `/config.json` and `/tenant/config.json` before entering the private app, so future Builder and runtime manifest clients should plug into that bootstrap rather than invent a second config path: [root.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/root.tsx#L106), [auth-runtime-followups.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/auth-runtime-followups.md#L5)

### Important gaps between accepted decisions and current code

- Gap: accepted architecture requires a navigation tree with typed targets, while the current shell runtime is flat.
- Gap: accepted architecture requires published metadata resolution, while current runtime routing is purely hardcoded.
- Gap: accepted architecture requires Builder capability gating, while current auth surface exposes only authentication state.
- Gap: accepted architecture requires shared metadata contracts, while the workspace has no `platform-builder-core` package yet.
- Gap: accepted architecture requires a publish boundary, while no draft/published/version client exists in `api-client`.

## Minimal V1 Scope

### In V1

1. Entity Model Designer
2. View Builder
3. Navigation / Sidebar Builder
4. Access Builder
5. Workflow Builder
6. Publish Center

### Explicitly out of V1

- freeform pixel editor
- Builder UI in `platform-admin-web`
- builder-defined auth or identity model
- builder-defined system modules
- raw SQL as the main admin DSL
- direct runtime reads from draft state
- multiple new shared packages before the contracts stabilize
- full view fork/rebase workflow in the first delivery slice
- arbitrary workflow scripting or user-authored code handlers

### Minimal end-to-end cut inside V1

The first shippable V1 slice should be smaller than the full product scope:

- one builder-only feature area in `tenant-web`
- one entity registry with fields, relations, child collections, and semantic roles
- one published form view and one published list/detail view
- one navigation tree that can link to published views and existing system modules
- one capability-gated Builder zone
- one publish flow that validates, previews, and promotes a versioned manifest

`checklist`, `modal`, richer variants, and broader workflow/policy UX can land after the first resolver-backed slice works.

## Recommended Folder Structure

### `packages/platform-builder-core`

This is the one approved shared package to add first. It is a deliberate exception to the default "no feature package until shared by two apps" rule because Builder preview, published runtime resolve, and future backend clients all need one common non-UI metadata contract.

```text
packages/platform-builder-core/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts
    contracts/
      common.ts
      model.ts
      view.ts
      navigation.ts
      policy.ts
      workflow.ts
      publish.ts
    schemas/
      common.schema.ts
      model.schema.ts
      view.schema.ts
      navigation.schema.ts
      policy.schema.ts
      workflow.schema.ts
      publish.schema.ts
    runtime/
      build-route-map.ts
      resolve-navigation-target.ts
      resolve-view-definition.ts
      validate-published-manifest.ts
```

Rules:

- no React code
- no `ui-kit` imports
- export only from `src/index.ts`
- own only typed contracts, schemas, and pure runtime helpers
- keep preview/runtime adapters pure so both Builder preview and tenant runtime can reuse them

### `apps/tenant-web/src/features/platform-builder`

```text
apps/tenant-web/src/features/platform-builder/
  index.ts
  routes.tsx
  shared/
    builder-shell.tsx
    builder-capabilities.ts
    builder-draft-store.ts
    builder-navigation-adapter.ts
  models/
    pages/models-page.tsx
    pages/model-editor-page.tsx
    components/entity-list.tsx
    components/entity-editor.tsx
  views/
    pages/views-page.tsx
    pages/view-editor-page.tsx
    components/view-canvas.tsx
    components/view-inspector.tsx
  navigation/
    pages/navigation-page.tsx
    components/navigation-tree-editor.tsx
  access/
    pages/access-page.tsx
    components/policy-matrix.tsx
  workflows/
    pages/workflows-page.tsx
    components/workflow-editor.tsx
  publish/
    pages/publish-page.tsx
  preview/
    pages/preview-page.tsx
  runtime/
    metadata-route-page.tsx
    published-manifest-loader.ts
    published-view-renderer.tsx
```

Rules:

- keep Builder UI app-local until a second app actually consumes it
- keep Builder shell, draft store, and navigation adapter in feature-local `shared/`
- keep metadata rendering code close to the feature until the runtime contract is proven
- do not move Builder UI into `packages/app-shell` or `packages/forms` in phase 1

## Minimal Core Contracts, Types, And Schemas To Land First

### First batch: required before any real Builder UI

These types unblock model editing, runtime resolve, preview, and publish lifecycle.

1. `BuilderNodeId`, `BuilderEntityId`, `BuilderViewId`, `BuilderPolicyId`, `BuilderWorkflowId`
2. `EntityDefinition`
3. `FieldDefinition`
4. `RelationDefinition`
5. `ChildCollectionDefinition`
6. `SemanticRoleBinding`
7. `OptionSetDefinition`
8. `ViewDefinition`
9. `ViewLayoutNode`
10. `ViewActionPlacement`
11. `NavigationTree`
12. `NavigationNode`
13. `NavigationTarget`
14. `SystemModuleCatalogEntry`
15. `DraftSnapshot`
16. `ValidationIssue` and `ValidationReport`
17. `PublishedManifest`

Recommended minimal shape:

- `FieldDefinition` owns storage meaning only
- `ViewLayoutNode` owns UI placement only
- `NavigationTarget` is a tagged union:
  - `{ kind: "view"; viewId: string }`
  - `{ kind: "system-module"; moduleKey: string }`
  - `{ kind: "external-link"; url: string }`
- `PublishedManifest` owns only published registries plus version metadata

### Second batch: required before Access and Workflow screens become real

1. `PolicySet`
2. `FieldPolicy`
3. `ActionPolicy`
4. `RecordFilterExpression`
5. `WorkflowDefinition`
6. `StatusDefinition`
7. `TransitionDefinition`
8. `ButtonDefinition`
9. `ActionBinding`
10. `ActionHandlerCatalogEntry`

### Schema recommendation

Use TypeScript contracts plus `zod` schemas inside `packages/platform-builder-core`.

Reason:

- the workspace currently has no runtime schema package for this feature
- the accepted decision already assumes typed validation
- `PublishedManifest` must be parsed defensively before it reaches tenant runtime

Constraint:

- add `zod` only to `packages/platform-builder-core`
- do not spread ad hoc validators through `tenant-web`

## Minimal Runtime Resolver And Preview MVP

### Runtime resolver MVP

The first runtime resolver should do exactly this:

1. load one `PublishedManifest`
2. validate it against `publishedManifestSchema`
3. derive a route map from published navigation nodes
4. resolve one route into one target:
   - published Builder view
   - existing system module
   - external link
5. render a metadata-backed page for `form`, `list`, and `detail`

For V1 MVP, keep the resolver simple:

- Builder-generated routes should live under `/app/:routeKey/*`
- existing hardcoded system modules should keep their own routes such as `/dashboard`
- navigation nodes targeting `system-module` should point to an app-local catalog entry rather than generating new code routes

### Preview MVP

Preview must not invent a second rendering stack.

Required behavior:

1. Builder editors update a local `DraftSnapshot`.
2. A pure adapter transforms draft state into the same shape as `PublishedManifest`.
3. `/builder/preview/:viewId` uses the same resolver and the same metadata renderer as runtime.
4. The only difference between preview and runtime is the manifest source:
   - preview: in-memory draft-derived manifest
   - runtime: validated published manifest

What the preview MVP does not need yet:

- full save/publish backend
- real record persistence
- pixel-perfect runtime theming
- diff/rebase for derived variants

## Routes And Pages To Add In `tenant-web`

### Builder routes

Add these protected routes under the existing authenticated area in [app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx#L191):

- `/builder`
- `/builder/models`
- `/builder/models/:entityId`
- `/builder/views`
- `/builder/views/:viewId`
- `/builder/navigation`
- `/builder/access`
- `/builder/workflows`
- `/builder/publish`
- `/builder/preview/:viewId`

Route behavior:

- `/builder` redirects to `/builder/models`
- all Builder routes are gated by a Builder capability check
- Builder routes render inside the existing tenant `WorkspaceShell`

### Runtime route

Add one metadata runtime route:

- `/app/:routeKey/*`

Purpose:

- this is the minimal entrypoint for published Builder-generated screens
- it avoids dynamic route registration complexity in the first slice
- it keeps system-module routes and metadata routes clearly separated

## Reuse From The Current Frontend Workspace

### Reuse now

- `@platform/app-shell`
  - reuse `WorkspaceShell`, loaders, app update banner, and locale helpers
  - do not move Builder-specific shells into this package yet
- `@platform/ui-kit`
  - reuse cards, tabs, accordion, menu, inputs, combobox, checkbox, badge, sidebar primitives, and loading states: [ui-kit/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/ui-kit/src/index.ts#L1)
- `@platform/auth-core`
  - reuse `AuthProvider`, `AuthGuard`, `useAuth`, and restored token access
- `@platform/tenant-core`
  - reuse tenant identity/branding hooks only when they become real shared runtime contracts
- `react-router-dom`
  - reuse current route stack for Builder and metadata runtime entrypoints

### Reuse later, not first

- `@platform/api-client`
  - the typed Builder clients belong here, but phase 0 can use feature-local mock loaders until the endpoints are defined
- `@platform/forms`
  - keep it unchanged in phase 1
  - only promote metadata field wrappers or validation helpers into `forms` after the Builder renderer stabilizes across more than one surface

## Places In Current Code That Need Adaptation

### Must adapt early

- [app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/app.tsx#L191)
  - extend the authenticated route map beyond `/dashboard`
- [private-app.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/app/private-app.tsx#L117)
  - stop treating the shell as dashboard-only
  - make header title, actions, and navigation state route-aware
- [navigation.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/apps/tenant-web/src/shared/navigation.ts#L8)
  - replace the singleton dashboard nav with a Builder-aware adapter
- `apps/tenant-web/src/features/platform-builder/runtime/*`
  - add manifest loading, route resolve, and metadata rendering

### Adapt with a local adapter first

- [workspace-shell.tsx](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/app-shell/src/workspace-shell.tsx#L25)
  - keep `WorkspaceShell` flat in the first slice
  - add a local adapter that flattens Builder navigation tree into `WorkspaceNavItem[]`
  - only upgrade `WorkspaceShell` contract after the first end-to-end slice proves the exact sidebar requirements

### Shared package changes that should follow once contracts are real

- [api-client/src/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/api-client/src/index.ts#L1)
  - add typed clients for `/profile`, Builder drafts, published manifest, publish actions, and versions
- [auth-core/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/auth-core/src/index.ts#L1)
  - add a reusable capability or claims surface once profile payload exists
- [tenant-core/src/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/tenant-core/src/index.ts#L1)
  - add real tenant context and permission mapping once Access Builder stops using mock data

### Explicitly do not adapt in phase 1

- [forms/src/index.ts](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/packages/forms/src/index.ts#L1)
  - this package is too thin today, but that is not a reason to turn it into the Builder metamodel
- `platform-admin-web`
  - no Builder route, page, or internal editor should be added there

## Recommended Implementation Phases

### Phase 0. Scaffolding And Runtime Entry Points

- add `packages/platform-builder-core`
- add `apps/tenant-web/src/features/platform-builder`
- wire protected Builder routes and one metadata runtime route
- add a local Builder capability adapter backed by mock session/profile data

Exit criteria:

- authenticated tenant user can open Builder routes
- runtime app can resolve `/app/:routeKey` through a local mock manifest

### Phase 1. Core Contracts And Manifest Validation

- land batch-one contracts and schemas in `platform-builder-core`
- add manifest parsing and validation helpers
- define one app-local system module catalog for `dashboard` and any future code-owned entries

Exit criteria:

- tenant runtime can validate and resolve one published manifest

### Phase 2. Runtime Resolver And Preview

- implement `PublishedManifest` loader
- implement `routeKey -> NavigationTarget -> runtime target` resolution
- implement metadata renderer for `form`, `list`, and `detail`
- implement `/builder/preview/:viewId` on the same resolver/renderer path

Exit criteria:

- one Builder-authored view can be previewed and rendered through the runtime resolver

### Phase 3. Entity Model Designer

- add CRUD for entities, fields, relations, child collections, and semantic roles
- enforce field/data separation at the contract level
- persist only draft metadata, not runtime page state

Exit criteria:

- one entity registry can drive view binding without overloading field types

### Phase 4. View Builder

- add structured canvas with palette, canvas, and inspector
- support slot-based nodes only:
  - section
  - group
  - tabs
  - tab
  - field
  - collection
  - text
  - divider
  - action bar
- do not implement absolute positioning

Exit criteria:

- form/list/detail view definitions can be edited and previewed through the shared renderer path

### Phase 5. Navigation Builder

- add group/item/divider tree editing
- add typed target selection for `view`, `system-module`, `external-link`
- flatten the tree into shell navigation for the first runtime slice

Exit criteria:

- published metadata can drive sidebar visibility and route linking

### Phase 6. Access And Workflow

- land batch-two policy/workflow contracts and schemas
- add role matrix, field state, action permissions, and basic record filter DSL
- add statuses, transitions, manual buttons, and code-owned handler bindings

Exit criteria:

- one published view can express access and workflow state without inventing a new auth system

### Phase 7. Publish Center And Hardening

- add validation summary
- add preview launch
- add publish action
- add published version list and promote/rollback hooks
- move typed clients into `api-client`

Exit criteria:

- tenant runtime reads only the latest selected published version

## Risks And Blockers

1. `WorkspaceShell` is flat today. If the team tries to redesign the shared shell before proving the manifest/runtime flow, delivery slows down immediately.
2. Builder access control is currently blocked on the absence of a real profile/capability payload. Mock gating is acceptable only for the first slice.
3. No backend draft/publish/version contract is defined yet. Preview can proceed locally, but publish/runtime handoff cannot finish without that API.
4. `tenant-core` and `auth-core` do not yet expose the permission model that Access Builder eventually needs.
5. There is no runtime schema/validator dependency in the workspace today. If `zod` is not added in a controlled way, validation will fragment into app-local ad hoc code.
6. The easiest implementation mistake is to recreate the old overloaded `FieldType` by mixing field storage, widget choice, layout blocks, and lookup source in one object.

## Open Questions

These are the only open questions that still matter for implementation ordering. Placement, app ownership, V1 scope, and the no-pixel-editor rule are already settled.

1. Which backend endpoint will own Builder drafts, published manifests, and version snapshots for tenant runtime consumption?
2. Will Builder capability come from authenticated `/profile`, tenant config, or both?
3. Should the system-module catalog remain app-local in `tenant-web` for V1, or should its stable keys move into `tenant-core` once more than one tenant-facing app consumes them?

## Next Step Recommendation

Start with one thin but real vertical slice:

1. create `packages/platform-builder-core`
2. wire `/builder/*` and `/app/:routeKey/*` in `tenant-web`
3. add a mock `PublishedManifest`
4. resolve one published `form` view and one `system-module` target from the same navigation manifest

That slice is the minimum proof that the accepted architecture can execute inside the current monorepo without reopening the core decisions.
