# Form Builder Module Contract

Status: active
Owner: frontend
Last audited: 2026-04-25
Canonical scope: active Form Builder authoring/runtime contract inside Platform Studio

This document is the tracked active contract for Form Builder.
It compacts the current stable truth from the older Form Builder source docs without carrying their working-plan history.

Read with:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` for field/catalog/rules/view-settings details
- `platform/backend/docs/contracts/platform-studio-form-builder.md` for backend-owned API/storage/runtime apply behavior

Detailed field/catalog/rules/view-settings facts live in the supporting contract:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

Read this after:

1. `platform/frontend/docs/contracts/platform-studio.md`
2. `platform/frontend/docs/modules/platform-studio/README.md`

## Historical Inputs

This document replaces the default read role of the old pointer-only Form
Builder contract slices. Those compacted files were deleted after migration.
Use git history only when auditing exact old text.

## Current Code Surfaces

Tenant app UI:

- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms`

Shared non-UI contracts/helpers:

- `platform/frontend/packages/platform-studio-core`

Current backend owner:

- `platform/backend/modules/tenant/platformstudioformbuilder`

Supporting frontend field/catalog contract:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Scope

Form Builder owns:

- model and view authoring
- model/view list and detail
- field and layout authoring
- authoring load/save
- lock and drift state needed by authoring UI
- additive runtime apply for managed form data
- runtime metadata derivation for model/view scopes
- runtime view preparation for later Navigation Builder exposure
- managed model export bundle as the future managed import source

Form Builder does not own:

- site publication as a product lifecycle
- sidebar/navigation composition
- runtime exposure and access assignment
- view sidebar visibility or active/inactive navigation placement
- post-submit events, notifications, integrations, or workflows
- PDF template authoring
- report authoring

Those concerns belong to other Platform Studio tools unless a later accepted contract says otherwise.

View payload compatibility note:

- `isActive` may remain in persisted view payloads for compatibility with older
  drafts and backend defaults
- Form Builder must not expose Active/Inactive controls or status icons for
  authored views
- Navigation Builder owns whether a form view appears in sidebar/navigation and
  how it is exposed to runtime users

## Identity And Naming

User-facing language:

- `Model`
- `View`
- `Structure locked`
- `Field locked`
- `Can edit views only`

Technical route params:

- `modelId`
- `viewId`

Identity rules:

- route params must resolve stable Form Builder model/view identity
- titles and display names are never identifiers
- SQL table/view names are never identifiers
- view-local `nodeId` is never model/view identity
- backend database `guid` is internal unless a specific API contract exposes it
- `viewId` and `viewKey` must not be silently conflated
- the default view may have `viewKey = default`, but it still has its own stable view identity

Authoring routes:

- `/builder/forms`
- `/builder/forms/:modelId`
- `/builder/forms/:modelId/views/:viewId`

Legacy compatibility redirects:

- `/builder/forms/:modelId/screens/:viewId`
- `/builder/forms/:dataSchemaId/ui/:uiSchemaId`

## Three-Schema Ownership

Form Builder uses three persisted schemas.

`ps_model.definition_json` owns:

- `dataSchema`
- `layoutBlueprint`

`ps_view.definition_json` owns:

- `uiSchema`

Core rules:

- one model owns one canonical `dataSchema`
- one model owns one canonical `layoutBlueprint`
- each view owns one `uiSchema`
- `ps_model` defines what every view must understand
- `ps_view` defines how one authored view looks and behaves

## `dataSchema`

`dataSchema` is model-owned.

It owns:

- logical model identity
- fields
- field kind and persisted status
- field display name / canonical label
- field storage key
- scope ownership through `schemaScopeId`
- root scope
- subform scopes
- scope runtime metadata

It must not own:

- view-local `nodeId`
- per-view title overrides
- per-view visibility
- per-view ordering
- nested layout container topology

Root scope id is always `root`.
Subform scopes must have stable `schemaScopeId`.

## `layoutBlueprint`

`layoutBlueprint` is model-owned.

It owns:

- default structural containers per scope
- default container hierarchy
- default field placement
- explicit unplaced field state at model level
- stable `containerKey` values

Accepted first stable container set:

- `section`
- `group`
- `grid`
- `column`
- `tabs`
- `tab_item`
- `accordion`
- `accordion_item`
- `subform`

Field placement rules:

- `fieldPlacements[].containerKey` points to an existing blueprint container or to `__scope_root__`
- `__scope_root__` means the field is intentionally placed at the current scope root
- unresolved placement becomes explicit `Unplaced fields`
- unresolved fields must not be silently appended to `root`

## `uiSchema`

`uiSchema` is view-owned.

It owns:

- view-local `nodeId`
- view-local container and field nodes
- `viewSettings`
- `filterDefinitions`
- visibility rules
- requirement rules
- per-view field titles
- per-view ordering
- view-local `unplacedFieldIds`
- view-specific runtime grid metadata

`uiSchema` is reconciled against `dataSchema + layoutBlueprint`.
It is not regenerated from scratch on every load.

## Default And Non-Default Views

The default view is the primary authoring surface for model-owned structure.

Default view may mutate:

- `dataSchema`
- `layoutBlueprint`
- its own `uiSchema`

Default view actions include:

- add field
- delete field from model
- create subform
- move a field across scopes
- create or reorder blueprint containers
- define default field placement

Default view rename rule:

- editing a field title in the default view may update the canonical `dataSchema` label
- label-only rename is metadata-only
- label-only rename must not advance `modelStructureVersion`
- label-only rename must not mark other views out of sync

Non-default views may mutate only their own `uiSchema`.

Non-default views must not silently mutate:

- `dataSchema`
- `layoutBlueprint`

Until an explicit cross-view blueprint-edit mode exists, model-structure and blueprint-layout actions should stay disabled outside the default view.

## Authoring Access And Locks

Current authoring access follows the backend tenant-secure Form Builder
baseline:

- authenticated tenant members may create, edit, and delete unlocked managed
  models and their default-view structure
- readonly users can open workspaces but cannot mutate authoring state
- non-root users cannot edit locked views
- non-root users cannot edit locked managed model structure
- static/external model structure is read-only even for root
- root users may change model/view authoring locks
- `canEditViewsOnly` means model structure is blocked for the current
  model/source state while view-local editing may remain available

## View Creation And Reconciliation

`Add View` creates a fresh `uiSchema` from:

- current `dataSchema`
- current `layoutBlueprint`

It must materialize blueprint containers and place fields by blueprint placement.
It must send unresolved fields to `Unplaced fields`.

`Copy View` clones the source view `uiSchema` exactly.
It must not rewrite the clone from `layoutBlueprint`.

Workspace load must reconcile:

1. current model
2. current view
3. all scopes in `dataSchema`
4. matching scopes in `layoutBlueprint`
5. matching scopes in `uiSchema`
6. missing subform anchors
7. missing blueprint containers by `containerKey`
8. missing fields by placement
9. unresolved fields into per-scope `unplacedFieldIds`

If reconciliation changes the view, `Save` remains active.
Existing view-local overrides and stable `nodeId` values should be preserved when possible.

## Save, Locks, And Versioning

Form Builder `Save` is authoring persistence plus additive runtime apply.
It is not site publication.

One save may write:

- current model metadata needed by the active view
- current model-owned schemas when allowed
- current view metadata
- current `uiSchema`
- updated lock and version state
- generated runtime metadata when missing

Server lock state wins over stale client assumptions.
Version mismatch is an edit conflict, not a silent overwrite.

Version rules:

- `modelStructureVersion` increments only when model topology changes: field IDs
  are added/removed, fields move between root/subform scopes, or subform scopes
  are added/removed/retargeted
- field settings such as placeholders, autocomplete, validation, `uniqueValue`,
  choice display settings, lookup settings, and option styles must not advance
  `modelStructureVersion`
- layout-only `layoutBlueprint` edits in the default view must not advance
  `modelStructureVersion`
- `viewVersion` increments when only one view `uiSchema` changes
- `lastAlignedModelStructureVersion` records the model structure version a view has reconciled/saved against
- a view is drifted when `modelStructureVersion > lastAlignedModelStructureVersion`

Additive runtime apply may:

- create missing managed tables
- add missing columns
- create or recreate SQL views
- create missing runtime metadata

Additive runtime apply must not:

- delete tables
- delete columns
- delete SQL views as a destructive migration path

If runtime apply fails after authoring save succeeds, the saved authoring state remains persisted and UI must surface partial success.

## Runtime Naming

Logical authoring keys and physical runtime names are separate layers.

Logical authoring keys include:

- `model.id`
- `model.key`
- `subform.tableKey`
- `view.key`

Physical runtime aliases include:

- `model.rtAlias`
- `scope.rtAlias`
- `view.rtAlias`

Runtime aliases are:

- lowercase ASCII
- `snake_case`
- deterministic
- shortened with hash suffix on overflow or collision
- immutable after first generation

Accepted prefixes:

- physical tables: `ps_`
- canonical data views: `vw_`
- grid views: `vg_`

Runtime metadata is required on:

- `dataSchema.rootScope.runtime`
- every `dataSchema.subformScopes[].runtime`
- `uiSchema.rootScope.runtime`
- every `uiSchema.subformScopes[].runtime`

`dataSchema` runtime answers storage/query ownership for a scope.
`uiSchema` runtime answers the authored view/grid surface for a scope.

Backend must generate missing runtime metadata during save and reuse it after generation.
Backend must not overwrite logical keys with physical runtime names.

## Runtime View Strategy

Form Builder runtime is per authored view, not per model.

Canonical runtime target:

```json
{
  "targetType": "form_builder_view",
  "modelId": "test-inspection",
  "viewId": "view-default"
}
```

There is one runtime engine with multiple entry contexts:

- Form Builder preview
- future Navigation Builder navigation entry
- future direct deep link

Rejected:

- a separate model-only data viewer
- a second builder-only data viewer
- a second runtime schema format

Runtime list should use the authored view-owned grid projection and should reuse the shared Collection Table pattern instead of inventing a second table runtime.

Runtime form should render create/read/edit from:

- `dataSchema`
- `layoutBlueprint`
- `uiSchema`

Current runtime implementation is list/read-first.
The code-backed backend surface currently includes runtime list meta, query,
search suggestions, saved filters, favorites, and record detail.
Runtime create/edit/save record flows are future `platformstudioformruntime`
scope, not completed Form Builder authoring scope.

## Runtime Routes And Access

Canonical runtime routes:

- list: `/app/forms/:modelId/views/:viewId`
- create: `/app/forms/:modelId/views/:viewId/new`
- read: `/app/forms/:modelId/views/:viewId/view/:docGuid`
- edit: `/app/forms/:modelId/views/:viewId/edit/:docGuid`

Public record identity:

- `docGuid`

Rejected public record identity:

- numeric database `id`
- table-local row number
- runtime `_id`

Platform Studio preview route:

- `/app/platform-studio/forms/:modelId/views/:viewId`

Access rules:

- `/app/forms/...` is real user-facing runtime context
- `/app/platform-studio/forms/...` is authoring preview context
- both render the same runtime engine
- backend access policy should branch by route namespace
- do not add a second target type or request `source` flag

Navigation Builder later stores exposure/grants against `form_builder_view`.
Favorites later resolve `form_builder_view` to the real runtime route, not to the preview route.

Current staging rule:

- do not invent temporary runtime grants before Navigation Builder ACL exists
- until Navigation Builder grants land, runtime APIs remain on the current tenant-auth baseline

## Static And External Models

Static/external models follow the same three-schema split:

- model owns `dataSchema + layoutBlueprint`
- view owns `uiSchema`

Current first static-model slice is root-scope-only.
`subformScopes` must be present as an empty array, not omitted.

Static/external model rules:

- `sourceType = external`
- Form Builder does not own the physical source table
- Form Builder owns managed `vw_*` and authored `vg_*` read surfaces
- schema is read-only even for root
- root may manage static model views
- static/external models do not expose managed export/import/data actions
- source-backed fields need explicit source mapping
- sensitive storage columns must not become ordinary authorable fields

Static model multi-view rule:

- all views share one canonical `dataSchema`
- all views share one canonical `layoutBlueprint`
- all views share one canonical `vw_*`
- each view owns its own `vg_*`

## Export And Future Import

Current export scope:

- `Export model` is supported for `managed` models
- `Export data` is supported for `managed` models
- `external` and `static` models do not expose export actions
- backend rejects direct export calls for non-managed model types

Current managed model bundle is the accepted future source for `Import model`.
There is no active import route/service yet.

Bundle root:

- `exportKind = form_builder_model`
- `formatVersion = v1`
- `model`
- `views`
- exactly one default view

Importer must treat these as source of truth:

- `model.dataSchema`
- `model.layoutBlueprint`
- `views[].uiSchema`

Importer must normalize lifecycle/version fields instead of trusting source tenant counters.
Importer must ignore source-tenant noise such as owner, diagnostics, export metadata, and generated GUIDs when the target persistence layer requires fresh values.

Managed import direction:

1. persist model and views
2. preserve canonical schemas
3. run runtime apply in the target tenant

External/static universal import remains incomplete until runtime/source metadata, dependency availability, and portability policy are finalized.

## Package Boundary

Current transitional backend owner is `platformstudioformbuilder`.

It owns:

- builder/control-plane behavior
- model/view CRUD
- authoring load/save
- authoring normalization and validation
- lock and root/static access policy
- runtime metadata derivation
- additive runtime apply orchestration
- export model bundle
- current runtime list/read scaffolding until extraction

Future `platformstudioformruntime` should own:

- runtime list query
- runtime record read
- runtime create/edit form
- runtime record save
- runtime filtering, sorting, paging, and row actions
- repositories for reading/writing authored record data

Future `platformstudioformactions` should own:

- after-save hooks
- notifications
- integrations
- workflow triggers
- async handoff/background jobs
- retry and side-effect failure reporting

The next large runtime slice should not expand `platformstudioformbuilder` by default.
It should start runtime extraction unless a later accepted decision changes the package boundary.

## Supporting Detail Docs

Field/catalog/detail docs remain supporting material and are not part of the default read path.
Open them only for the exact feature area being changed.

Backend API/storage/migration detail should move into a backend Form Builder contract in a later slice.

Out of scope for this compact contract:

- full field catalog
- per-field inspector schemas
- backend request/response payload detail
- SQL generation matrices
- destructive migration workflow
- Navigation Builder implementation
- Action Builder implementation
- PDF Builder implementation
- Report Builder implementation
