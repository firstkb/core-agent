# Platform Builder V2 Foundation Brief

## Recommendation

Platform Builder V2 should start as a builder workspace entered from the tenant workspace header, not as a tenant sidebar module.
Its first durable product shape should be two builders:

1. Forms
2. Navigation

Forms is the primary builder and the first implementation slice.
The product baseline should be:

- a clear list of data schemas
- multiple UI schemas under each data schema
- direct opening of a selected UI schema into a real builder workspace
- permissions and locking enforced from the first slice

The current cockpit-style builder UI should remain retired.
The current typed contract and published-runtime foundation are still worth keeping, but only as technical substrate.

## Recommended V2 IA

### Global entry

- Platform Builder enters from a trail bar or workspace-header control wired through the existing `WorkspaceShell` header surface in `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
- do not restore Platform Builder to `platform/frontend/apps/tenant-web/src/shared/tenant-sidebar-navigation.tsx`
- the entry opens a compact builder switcher with:
  - `Forms`
  - `Navigation`

### Forms IA

Forms should use a three-step information architecture:

1. `Platform Builder / Forms`
   - primary screen is a data schema index
   - each data schema row shows name, structural lock state, field count, UI schema count, and ownership summary
2. `Platform Builder / Forms / {Data Schema}`
   - selected data schema shows:
     - structural summary
     - field list with lock badges
     - UI schemas grouped under that data schema
3. `Platform Builder / Forms / {Data Schema} / {UI Schema}`
   - opens a real builder workspace
   - workspace composition:
     - left: schema field palette and layout outline
     - center: authoring canvas
     - right: contextual inspector
     - secondary preview pane or preview mode

This keeps the primary mental model clear:

- pick a data schema
- pick one of its UI schemas
- edit that UI schema in a workspace

### Navigation IA

Navigation should remain compact and direct:

1. `Platform Builder / Navigation`
   - editable tree is the main surface
   - item target selection and access settings live in a secondary panel

Navigation should not start with a separate Module object.
The first-class concepts should remain:

- `group`
- `item`
- `divider`

## Kept Foundation

### Keep active as technical foundation

- `platform/frontend/packages/platform-builder-core/src/contracts/**`
- `platform/frontend/packages/platform-builder-core/src/schemas/**`
- `platform/frontend/packages/platform-builder-core/src/runtime/build-route-map.ts`
- `platform/frontend/packages/platform-builder-core/src/runtime/resolve-navigation-target.ts`
- `platform/frontend/packages/platform-builder-core/src/runtime/resolve-view-definition.ts`
- `platform/frontend/packages/platform-builder-core/src/runtime/evaluate-visibility-policy.ts`
- `platform/frontend/packages/platform-builder-core/src/runtime/validate-draft-snapshot.ts`
- `platform/frontend/packages/platform-builder-core/src/runtime/validate-published-manifest.ts`
- `platform/frontend/apps/tenant-web/src/features/published-app/**`
- the tenant workspace shell entry points in:
  - `platform/frontend/apps/tenant-web/src/app/app.tsx`
  - `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - `platform/frontend/apps/tenant-web/src/shared/navigation.ts`

### Why these stay

- the current contract layer is UI-free and already separates model, navigation, policy, and published-runtime validation
- the published runtime already proves route resolution, visibility evaluation, and manifest consumption without depending on the retired builder UI
- the workspace shell already has the correct header surface for a builder entry

### Keep only as technical reference, not as live product baseline

- `platform/frontend/docs/platform-builder-v2/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/draft/builder-draft-store.ts`
- `platform/frontend/docs/platform-builder-v2/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/draft/builder-preview-manifest.ts`
- `platform/frontend/docs/platform-builder-v2/old-code-reference/code-snapshot/tenant-web/src/features/platform-builder/views/view-builder-state.ts`

These are useful for immutable draft updates, preview adaptation, and layout-tree mutation patterns, but they should be re-homed into app-local V2 modules instead of revived as old builder code.

## Retired Surfaces

The following should stay retired as product baseline:

- builder as a tenant sidebar section
- cockpit-style hero, diagnostics cards, action rail, and state rail
- top-level `Access`, `Publish`, `Workflows`, and similar diagnostics-first pages
- metadata-card-first editing in place of a real builder workspace
- preview-first and publish-first product framing
- capability-gate rollout UI and demo allowlist framing
- old builder-specific CSS shell and page chrome

The archive under `platform/frontend/docs/platform-builder-v2/old-code-reference/` remains reference material only.

## Schema / UI Model

### Product language

The authoring model should use product language that is clearer than the current flat registry bundle:

- `Data Schema`
- `UI Schema`
- `Navigation Tree`

### Data schema

A data schema is the structural contract and ownership boundary.
It should aggregate:

- entity identity and labels
- fields
- relations
- child collections
- option sets
- semantic roles
- structural ownership
- schema lock state
- field lock state

Current technical mapping:

- `EntityDefinition`
- `FieldDefinition`
- `RelationDefinition`
- `ChildCollectionDefinition`
- `OptionSetDefinition`
- `SemanticRoleBinding`

### UI schema

A UI schema is one presentation of one data schema.
It should have its own lifecycle and authorship, separate from structural schema ownership.

Required UI schema attributes:

- `id`
- `dataSchemaId`
- `key`
- `title`
- `kind`
  - `form`
  - `detail`
  - `list`
  - `grid`
  - future variants as needed
- `channel`
- `isDefault`
- `owner mode`
  - owned
  - inherited-from-base
- layout nodes
- UI-only behavior
  - default sort
  - visible columns
  - filter presets
  - widget configuration
  - preview seed metadata

Current technical mapping:

- `ViewDefinition`
- `ViewLayoutNode`

### Recommended model boundary

Keep the current `platform-builder-core` registry bundle as the runtime and validation substrate.
Do not let that flat bundle become the V2 product IA.

Recommended authoring boundary:

- app-local Forms authoring state should model data schemas and UI schemas explicitly
- an adapter layer should translate that authoring model into the existing draft/published contract shape when needed

This preserves current runtime value without forcing the old registry language into the new product.

## Permissions / Lock Model

Permissions and locking are core V2 requirements and should be first-class in the Forms foundation.

### Roles

#### Schema owners

Can:

- create and edit data schema structure
- add, remove, rename, and retype fields
- manage relations, child collections, and option sets
- lock or unlock schema structure
- lock or unlock individual fields
- assign UI authors for the schema

Cannot delegate structural changes through UI-only permissions.

#### UI-only authors

Can:

- create UI schemas under an allowed data schema
- edit UI layout and presentation
- bind existing fields into UI schemas
- configure widget and layout behavior allowed by the UI schema

Cannot:

- change field structure
- add or remove fields from the data schema
- rename or retype fields
- change schema or field locks

#### Navigation authors

Can:

- edit the navigation tree
- reorder nodes
- change labels, icons, targets, and visibility settings

Cannot:

- change data schema structure
- bypass schema or field locks

#### Readonly users

Can:

- see schema lists, UI schema lists, and navigation trees if granted visibility
- open builder workspaces in readonly mode
- inspect lock state and ownership state

Cannot edit anything.

### Lock rules

#### Schema lock

When schema lock is on:

- only schema owners can change data schema structure
- UI-only authors can still create and edit UI schemas under that data schema
- existing UI schemas remain editable unless a separate UI-level restriction is applied later

#### Field lock

When a field lock is on:

- the field remains bindable in UI schemas
- structural field properties are readonly except for schema owners
- UI authors may still control presentation-only settings for that field in a UI schema
- destructive changes such as delete, key change, or type change require unlock or clone-to-new-schema-version

#### Readonly workspace state

When a user lacks edit permission:

- the workspace still opens
- outline, palette, and inspector show current state
- editing controls are disabled with explicit permission or lock messaging

### Recommended persistence boundary

Do not overload current published-runtime `PolicySet` objects to carry authoring locks.

Use a separate authoring-side permission model for:

- schema ownership
- UI authoring rights
- navigation authoring rights
- readonly visibility
- schema lock
- field locks

Current `PolicySet` and visibility evaluation stay valuable for runtime navigation access, but they are not sufficient as the primary authoring permission system.

## Navigation Target Model

Navigation should remain compact and target-first.

Recommended target union:

- `ui-schema`
  - primary target for authored application pages
- `static-tool`
  - stable internal tools exposed by the tenant shell
- `internal-route`
  - escape hatch for known runtime routes that are not UI schemas
- `external-link`

Recommended node model:

- `group`
- `item`
- `divider`

This preserves the useful compactness of the current `NavigationNode` model while changing the product language from generic `view` targets to explicit UI-schema targets.

## First Implementation Slice

### Slice name

Forms Foundation: schema index, UI schema index, and real builder workspace

### Goal

Establish the real V2 Forms baseline without implementing backend behavior, publishing, or the Navigation UI yet.

### Included in the slice

- Platform Builder entry from the workspace header
- first route shape:
  - `/builder/forms`
  - `/builder/forms/:dataSchemaId`
  - `/builder/forms/:dataSchemaId/ui/:uiSchemaId`
- Forms home screen with:
  - data schema list
  - selected data schema details
  - multiple UI schemas under that data schema
- route into a real UI schema workspace
- app-local authoring state seeded from fixtures or mock data
- builder workspace with:
  - field palette from the selected data schema
  - layout outline
  - canvas
  - inspector
  - mock preview
- first editable node set:
  - `section`
  - `group`
  - `field`
  - `text`
  - `divider`
- permission and lock enforcement for:
  - schema owners
  - UI-only authors
  - field locks
  - readonly users

### Explicitly deferred from the slice

- backend persistence
- publishing flow
- runtime diagnostics
- workflow authoring
- access dashboards
- full Navigation builder UI
- child-collection and subform editing beyond model placeholders
- advanced list/grid filter editors
- shared-package extraction

### Why this is the right first slice

- it matches the approved product direction exactly
- it creates the real Forms workflow instead of another summary dashboard
- it proves the critical model boundary between data schemas and multiple UI schemas
- it forces permissions and locks into the first workspace design instead of treating them as follow-up polish

## Out Of Scope

- production backend contracts or persistence
- route publishing or release workflow
- broad cleanup beyond the already retired builder surfaces
- detailed Navigation implementation beyond compact target model framing
- copying code or UI from `EXTDB`, `ezform`, or the retired builder
- creating a new shared package

## Concrete File / Module Boundaries

### New app-local feature boundary

Add the first V2 slice under tenant-web, not a shared package:

- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/index.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/routes.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/shell/platform-builder-header-entry.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/shell/platform-builder-shell.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/model/forms-authoring-types.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/model/forms-authoring-fixtures.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/model/forms-permissions.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/model/platform-builder-core-adapter.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/state/forms-authoring-store.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/state/ui-schema-layout.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/pages/forms-home-page.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/pages/ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/schema-list-panel.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/ui-schema-list-panel.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/workspace-header.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/field-palette.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/layout-outline.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/builder-canvas.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/inspector-panel.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-builder-v2/forms/components/mock-preview-panel.tsx`

### Limited shell integration touch points

Only the following live shell files should change for the first slice:

- `platform/frontend/apps/tenant-web/src/app/app.tsx`
  - add builder routes
- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - add header entry for Platform Builder
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
  - add header-title resolution for builder routes

Do not change:

- `platform/frontend/apps/tenant-web/src/shared/tenant-sidebar-navigation.tsx`

### Existing foundation intentionally reused, not replaced

- `platform/frontend/packages/platform-builder-core/**`
  - keep as typed contract and validation substrate
- `platform/frontend/apps/tenant-web/src/features/published-app/**`
  - keep as runtime/preview reference

For the first slice, avoid edits in those areas unless a narrow adapter or additive contract gap is unavoidable.

## Reference Notes

The legacy interaction and business-behavior references used for this brief live in:

- `platform/frontend/docs/platform-builder-v2/ezform/**`
- `platform/frontend/docs/platform-builder-v2/EXTDB/**`

They are useful for ergonomics and hidden product requirements, but they should not be copied forward as code or UI baseline.
