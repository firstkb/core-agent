# Platform Studio Foundation Brief

## Recommendation

Platform Studio should stay app-local in tenant-web and enter from the left rail area, not from a header split-button and not from the tenant sidebar module list.
Its first durable product shape remains:

1. Form Builder
2. Navigation Builder

Form Builder is still the first implementation slice, but its live scaffold should now match the approved product direction more closely:

- one master-detail Form Builder screen
- selected model details on the same screen as the model list
- a separate minimal view workspace route only when the user opens a specific view
- short top-bar titles plus shell meta breadcrumbs
- simplified visible copy: `Model`, `View`, `Structure locked`, `Field locked`, `Can edit views only`

The scaffold should not present metadata-heavy summary cards, header-entry chrome, or a three-step object-summary-to-workspace flow as the product baseline.

## Recommended V2 IA

### Global entry

- add one `Platform Studio` entry to the tenant left rail area through `WorkspaceShell.railUtilities`
- remove the live header split-button entry
- do not restore Platform Studio to `platform/frontend/apps/tenant-web/src/shared/tenant-sidebar-navigation.tsx`

### Forms IA

Form Builder should use a master-detail model, not three disconnected steps.

Recommended route shape:

- `/builder/forms`
  - Form Builder master-detail screen with model list and empty detail state
- `/builder/forms/:modelId`
  - same Form Builder master-detail screen with one selected model
- `/builder/forms/:modelId/views/:viewId`
  - minimal view workspace route

Recommended Forms screen behavior:

- left side: model list
- right side: selected model detail
- selected model detail includes:
  - lock badges
  - field tags
  - direct list of views
  - small search field above the view list
  - `Add view` scaffold action
- model list includes `Add model` scaffold action

Primary-screen rules:

- do not emphasize raw field counts
- do not emphasize owner labels
- do not emphasize raw view-count summaries
- show actual views directly in the UI area instead

### View workspace IA

The separate view workspace route is still valid, but it should stay visually light for this pass:

- no hero block
- no inspector-heavy summary chrome
- small back action
- lock badges in compact form
- local workspace placeholder only

### Navigation IA

Navigation remains the second primary builder, but it is not part of this correction pass.
The compact target-first direction from the existing V2 brief still stands.

## Kept Foundation

Keep active as technical substrate:

- `platform/frontend/packages/platform-studio-core/src/contracts/**`
- `platform/frontend/packages/platform-studio-core/src/schemas/**`
- `platform/frontend/packages/platform-studio-core/src/runtime/build-route-map.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/resolve-navigation-target.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/resolve-view-definition.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/evaluate-visibility-policy.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/validate-draft-snapshot.ts`
- `platform/frontend/packages/platform-studio-core/src/runtime/validate-published-manifest.ts`
- `platform/frontend/apps/tenant-web/src/features/published-app/**`
- tenant shell integration seams in:
  - `platform/frontend/apps/tenant-web/src/app/app.tsx`
  - `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - `platform/frontend/apps/tenant-web/src/shared/navigation.ts`

Why these stay:

- the runtime contracts remain useful substrate
- validation and runtime resolution remain useful substrate
- the tenant shell already exposes the rail and header seams needed for the corrected scaffold

## Retired Surfaces

These should stay retired as the live product baseline:

- header split-button entry for Platform Studio
- Forms as a three-step list -> summary -> workspace journey
- hero blocks on the Forms screen
- hero blocks on the screen workspace
- summary-noise cards focused on counts, owners, and admin diagnostics
- visible `Data Schema` and `UI Schema` copy in the live scaffold
- cockpit-style builder chrome

## Visible Product Language And Technical Mapping

### Visible product language

The live scaffold should use:

- `Model`
- `View`
- `Structure locked`
- `Field locked`
- `Can edit views only`

### Technical mapping

Under the hood, the current runtime substrate is still based on data-schema and view-style contracts.
That remains acceptable as an internal foundation.

Recommended rule:

- use `Model` and `View` in user-facing copy
- converge shared contract language toward `ModelDefinition`, `ModelFieldDefinition`, and `ViewDefinition`
- keep legacy contract terms such as `EntityDefinition` behind compatibility aliases only while migration remains in progress

## Permissions / Lock Model

Permissions and locking remain core V2 requirements.
For this scaffold pass, the live UX only needs to show the approved language clearly:

- `Structure locked`
- `Field locked`
- `Can edit screens only`

The deeper authoring and enforcement model still remains:

- schema owners control structure
- UI-only authors can work on views without structural edits
- field locks remain visible and meaningful
- readonly users can open workspaces without editing

Do not overload runtime visibility policies as the authoring lock model.

## Navigation Target Model

No change from the earlier V2 direction:

- keep Navigation compact and target-first
- do not force a separate Module object
- keep target modeling smaller until Navigation implementation begins

## First Implementation Slice

### Slice name

Form Builder Foundation A: master-detail scaffold correction

### Goal

Make the live tenant-web scaffold reflect the approved product direction before real authoring logic begins.

### Included in the slice

- move the Platform Studio live entry into the left rail area
- remove the header split-button entry
- use shell `headerTitle` plus `headerMeta`
- use the corrected Form Builder route model:
  - `/builder/forms`
  - `/builder/forms/:modelId`
  - `/builder/forms/:modelId/views/:viewId`
- keep `/builder/forms` and `/builder/forms/:modelId` as one master-detail page
- retire the standalone model summary page from the live route model
- replace visible schema/UI-schema copy with model/view copy
- remove summary-noise emphasis
- add a small search field above views
- add visible `Add model` and `Add view` scaffold actions
- keep the view workspace route minimal and local-placeholder only
- update English and Spanish locale strings used by the scaffold

### Explicitly deferred from the slice

- real canvas behavior
- drag/drop
- persistence
- backend integration
- real permission enforcement
- view creation flow
- model creation flow
- Navigation builder implementation
- shared-package extraction

## Out Of Scope

- production backend contracts or persistence
- publish/release workflow
- broad refactors outside tenant-web and directly conflicting V2 docs
- copied code or copied UI from `EXTDB`, `ezform`, or the retired builder

## Concrete File / Module Boundaries

### App-local feature boundary

Keep the scaffold under:

- `platform/frontend/apps/tenant-web/src/features/platform-studio/`

The live scaffold should remain tenant-web local.
Do not extract a new shared package for this pass.

### Shell integration touch points

The bounded live integration remains:

- `platform/frontend/apps/tenant-web/src/app/private-app.tsx`
  - left rail entry
  - shell `headerMeta`
- `platform/frontend/apps/tenant-web/src/shared/navigation.ts`
  - short titles plus breadcrumb/meta resolution
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`

Sidebar navigation should remain unchanged.

## Reference Notes

Reference usage for this brief remains:

- `platform/frontend/docs/platform-studio/old-code-reference/**`
  - consult only when previous technical behavior is truly needed
- `platform/frontend/docs/platform-studio/EXTDB/**`
  - legacy product-behavior reference only
- `platform/frontend/docs/platform-studio/ezform/**`
  - interaction reference only

None of these references should become the live scaffold baseline.
