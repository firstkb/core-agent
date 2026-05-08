# Platform Studio Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: Platform Studio suite boundary, tool ownership, tenant-web/shared package split, and canonical suite naming

This contract defines the Platform Studio suite boundary.
It intentionally does not expand Form Builder details; current Form Builder behavior lives in `platform/frontend/docs/modules/platform-studio/form-builder.md`.

Read with:

- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md` for active Form Builder work
- `platform/frontend/docs/modules/tenant-web.md` for tenant app ownership and placement
- `platform/backend/docs/contracts/platform-studio-form-builder.md` for backend-owned Form Builder API/storage/runtime apply behavior

## Core Invariants

- Platform Studio is the tenant-web builder/configuration tool suite.
- Platform Studio is not a synonym for Form Builder.
- Form Builder is the current active implementation tool.
- Navigation Builder has an active V1 surface plus backend persistence,
  access authoring, and runtime sidebar/utility rail visibility projection.
  Direct Form View/App Page route/API ACL enforcement remains planned.
- Action Builder, PDF Builder, and Report Builder are planned tools.
- Planned tool concerns must not be implemented inside Form Builder just because Form Builder is active first.
- Platform Studio UI stays app-local in `tenant-web`.
- Shared code for Platform Studio is non-UI contracts/helpers under `@platform/platform-studio-core`.
- Do not create per-builder shared packages until reuse and API stability are proven.
- Current apps are online web apps; do not add offline/PWA/mobile assumptions to Platform Studio without explicit activation.

## Current Code Boundaries

App-local Platform Studio UI:

- `platform/frontend/apps/tenant-web/src/features/platform-studio`

Shared non-UI package:

- `platform/frontend/packages/platform-studio-core`

Current package role:

- typed metadata contracts
- runtime validation schemas
- pure snapshot/runtime helpers
- compatibility aliases while older builder terminology migrates

Package anti-scope:

- it is not the whole Platform Studio product surface
- it must not become a shared UI package by accident
- it must not absorb per-tool screens before stable reuse is proven

## Tool Ownership

Form Builder:

- status: active
- owns model and view authoring
- owns field/layout authoring
- owns authoring save
- owns additive runtime apply for managed form data
- owns runtime view entry preparation for later Navigation Builder exposure

Navigation Builder:

- status: active UI-first V1
- owns sidebar/navigation composition
- owns app page targets
- owns broader product module targets
- owns authored runtime route targets
- owns runtime exposure of configured application entries
- owns rail utility visibility/access UX for static shell utilities such as
  Platform Studio, Task Manager, Favorites, and Help Center
- is expected to own access/permission assignment unless a later accepted decision creates a separate Access Builder
- V1 access authoring writes saved policy for app menu and utility rail items
  but must not be described as enforced route/API security until runtime
  evaluator and guards land.
- V1 Access tab shows strategy and recipient logic inline. Selection dialogs
  only choose records for users, companies, company types, and job types.
  The editable strategy UI exposes `Inherits parent access`, `Selected
  recipients only`, and `Everyone except selected recipients`; `All
  authenticated users` is retained only as a default/compatibility mode because
  child access cannot expand a restricted parent. Recipient selection uses
  centered table dialogs with search and pagination instead of loading bulk
  lists into the builder page.
  Matching semantics are `users OR ((companies OR company types) AND job types)`.
- V1 uses editable draft behavior plus explicit `Save`; realtime live
  navigation mutation is not the accepted interaction model
- V1 sorting is per parent level. Moving an item affects only siblings under
  the same root/group/module parent.
- V1 uses `Menu title` as the user-facing root-only text divider with no icon,
  target, or children.
- Runtime sidebar rendering treats `Menu title` as an app-layer section heading
  in the UI Lab `GENERAL` style and suppresses empty, consecutive, or trailing
  title sections so orphan headings do not appear in the tenant app.
- V1 add choices are fixed at creation: `Menu title`, `Menu group`, `Form view`,
  `App page`, and `Link`; `App module` remains visible as a disabled future choice until
  real app module routes ship. Target-bearing choices use a centered, minimal
  fixed-type add dialog to choose the target before creation and do not expose a
  mutable target type switch in the inspector after creation.
- V1 blocks duplicate target selection during add when the same Form View, App
  Page, External Link, or App Module target already exists in the app menu.
- V1 inspector tabs are `Element` and `Access`; `Advanced` is not exposed.
  Technical route keys stay out of the V1 inspector, and `Channel` belongs in
  `Element`.
- V1 `Element` is type-aware: label/type/status live at the top, `Opens`
  appears only for target-bearing items, `Channel` appears only where runtime
  exposure applies, and `Warnings` appears only when warnings exist.
- V1 `Element` includes a `Show in app menu` toggle for app menu containers and
  target entries. Inactive app menu items remain editable in the builder tree,
  show an eye-off status badge, and are excluded from runtime app menu output
  in saved runtime sidebar projection. Menu titles do not
  expose active, target, channel, or access controls.
- V1 deletion follows Form Builder field deletion UX: danger-zone `Delete item`
  action in the inspector with a centered confirmation dialog. Deleting a
  container removes its child items from the draft navigation.
- V1 Form View entry labels are derived from the selected View title
  continuously, not manually copied once.
- V1 add controls are limited to container rows and the bottom root add row;
  titles and final entries do not show `+` actions.
- V1 navigation icons are configurable for every editable app menu item except
  `Menu title`. The icon picker starts with `None` so any item can render
  without an icon, and the dictionary includes inspection-oriented choices such
  as checklist, hazard, camera, safety, work, maintenance, PPE, fire, fleet,
  equipment, location, people, documents, forms, reports, routes, activity,
  completed, and settings. Status badges may still show hidden,
  restricted/access, or broken state.
- Future App Module targets are represented as containers with possible nested
  subitems, but they stay inactive/preview-only until real app module runtime
  routes ship.
- Runtime shell integration must preserve Navigation Builder context: when a
  configured sidebar entry opens an App Page or Form View, the tenant top bar
  title and breadcrumb should be resolved from the Navigation Builder path and
  target metadata, not from raw route ids or static fallback route labels.

Action Builder:

- status: planned
- owns authored events
- owns view-triggered behavior
- owns notifications
- owns conditional field changes
- owns post-submit side effects

PDF Builder:

- status: planned
- owns PDF template configuration
- owns generated document output from authored/runtime data
- must not be confused with a generic table row action named `pdf`

Report Builder:

- status: planned
- owns report definitions
- owns analytical/read-only reporting outputs
- owns report-specific query/group/filter/presentation settings

Future tools:

- must declare owner boundary before implementation starts
- must not widen Form Builder scope by default

## Canonical User-Facing Language

Use:

- `Platform Studio`
- `Form Builder`
- `Navigation Builder`
- `Action Builder`
- `PDF Builder`
- `Report Builder`
- `Model`
- `View`

For current Form Builder UI, use:

- `Structure locked`
- `Field locked`
- `Can edit views only`

Do not use as active user-facing Form Builder language:

- `Object`
- `Screen`
- `Data Schema`
- `UI Schema`
- `UI Builder`

## Canonical Technical Language

Shared technical contracts should converge on:

- `ModelDefinition`
- `ModelFieldDefinition`
- `ViewDefinition`
- `LayoutNode`
- `LockPolicy`
- `StorageBinding`

Compatibility aliases may remain temporarily for older names when changing transport shape would create avoidable drift.

Allowed temporary compatibility examples:

- `EntityDefinition`
- `FieldDefinition`
- manifest payload keys such as `entities` and `fields`

## Current Route Model

Form Builder authoring routes:

- `/builder/forms`
- `/builder/forms/:modelId`
- `/builder/forms/:modelId/views/:viewId`

Navigation Builder authoring route:

- `/builder/navigation`

Legacy compatibility redirects:

- `/builder/forms/:modelId/screens/:viewId`
- `/builder/forms/:dataSchemaId/ui/:uiSchemaId`

Runtime and preview route direction:

- real runtime list route: `/app/forms/:modelId/views/:viewId`
- Platform Studio preview route: `/app/platform-studio/forms/:modelId/views/:viewId`

Route rules:

- active route params are `modelId` and `viewId`
- visible UI copy uses `Model` and `View`
- `/app/platform-studio/forms/...` is preview/authoring context, not a Navigation Builder runtime target

## Current Decisions

- Form Builder `Save` is authoring persistence plus additive runtime apply, not site publication.
- Site exposure, sidebar placement, and runtime permission assignment are Navigation Builder concerns.
- A single app page such as Business Tree is not a product module. Product
  modules are broader product areas such as future Training or Task Manager.
- Navigation Builder entries may target Form Views, App Pages, External Links,
  and future App Module pages. App Modules can own nested subitems.
- Dashboard remains a static locked shell item shown in Navigation Builder
  preview but not removable or movable by the builder. Dashboard must not show
  the lock badge; the lock badge is reserved for access/restricted state.
- Dashboard is not selectable for editing in the Navigation Builder app menu
  tree.
- Empty or missing Navigation Builder configs start with only locked Dashboard;
  do not seed mock Safety/Training/Form View entries into production builder
  state.
- Rail utility access is separate from the sidebar tree. Navigation Builder V1
  exposes utility rail items as a dedicated left-panel tab and uses the same
  saved access policy model, active/inactive toggle, and runtime visibility
  projection as app menu items.
- Root-only navigation access is a protected Navigation Builder strategy:
  root users can assign it, and backend save rejects non-root attempts to create
  or remove root-only protection.
- Events, notification side effects, and post-submit automation are Action Builder concerns.
- PDF and report generation are separate tool concerns unless an accepted lower-level capability contract says otherwise.

## Out Of Scope

- detailed Form Builder field/catalog/backend implementation detail
- full field catalog
- Form Builder backend API/storage rules
- Navigation Builder data model
- Action Builder workflow model
- PDF template schema
- Report definition schema
- offline/PWA/mobile delivery behavior
