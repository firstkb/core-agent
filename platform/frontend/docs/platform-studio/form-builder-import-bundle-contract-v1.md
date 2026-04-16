# Form Builder Import Bundle Contract v1

Status: accepted planning contract
Date: 2026-04-16

## Purpose

This document defines the import contract for the current `Export model` bundle produced by Form Builder.

It answers three questions:

1. what the current export JSON already contains and can be accepted by an importer
2. what an importer must ignore or normalize instead of trusting blindly
3. what must be added to the export bundle before cross-tenant import is considered complete

This contract is written against the currently exported bundle shape:

```json
{
  "exportKind": "form_builder_model",
  "formatVersion": "v1",
  "exportedAt": "2026-04-16T20:36:27Z",
  "model": { "...": "..." },
  "views": [{ "...": "..." }]
}
```

## Current conclusion

For a `managed` model, the current bundle is already sufficient to import:

- model metadata
- canonical `dataSchema`
- canonical `layoutBlueprint`
- all authored views
- each view `uiSchema`

and then let backend runtime apply create:

- managed tables
- canonical data views
- grid views
- subform runtime objects

The current bundle is not yet a complete universal import format for all model types.

The main remaining gaps are:

- explicit dependency manifest
- explicit conflict policy
- explicit import lifecycle policy
- explicit source/runtime portability rules for `external` and `static` models

## Current export scope

Current product scope is intentionally narrower than a universal import/export surface.

Today:

- `Export model` is supported only for `managed` models
- `Export data` is supported only for `managed` models
- `external` and `static` models do not expose either export action in tenant-web
- backend also rejects direct export calls for non-managed model types

This contract should therefore be treated as the active source format for future `managed` `Import model`, not as a final all-model transport format.

## Accepted bundle root

Importer accepts:

- `exportKind`
  - must equal `form_builder_model`
- `formatVersion`
  - must equal `v1`
- `exportedAt`
  - informational only
- `model`
  - required
- `views`
  - required
  - must contain at least one view
  - must contain exactly one `isDefault = true` view

Importer rejects:

- missing `model`
- missing `views`
- empty `views`
- multiple default views
- no default view
- mismatched `views[].modelId`

## Accepted model payload

Importer accepts these model-level fields from `bundle.model`:

- `id`
- `key`
- `title`
- `displayName`
- `description`
- `sourceType`
- `storageKey`
- `isStructureLocked`
- `canEditViewsOnly`
- `dataSchema`
- `layoutBlueprint`

Importer also accepts legacy/compat duplicates when present:

- `modelLocked`
- `name`

The importer must treat `dataSchema` and `layoutBlueprint` as the model-owned source of truth.

## Accepted view payload

Importer accepts these view-level fields from each `bundle.views[]` entry:

- `id`
- `key`
- `title`
- `displayName`
- `description`
- `kind`
- `isDefault`
- `isActive`
- `isViewLocked`
- `modelId`
- `uiSchema`

Importer also accepts legacy/compat duplicates when present:

- `viewLocked`
- `name`

The importer must treat `uiSchema` as the view-owned source of truth.

## Accepted schema content

Importer accepts and persists:

- `dataSchema.rootScope`
- `dataSchema.subformScopes`
- `layoutBlueprint.rootScope`
- `layoutBlueprint.subformScopes`
- `uiSchema.rootScope`
- `uiSchema.subformScopes`
- runtime blocks already embedded in scopes

This means the current bundle is already structurally sufficient for:

- root fields
- subform fields
- subform containers
- per-view root layout
- per-view subform layout
- grid settings
- system fields
- per-view overrides

## Importer normalization rules

Importer must normalize instead of trusting raw payload as-is.

### Model normalization

Importer should normalize:

- `displayName`, `title`, `name`
  - canonical import value should resolve to one display title
- `isStructureLocked` and `modelLocked`
  - canonical value is `isStructureLocked`
- `canEditViewsOnly`
  - may be recomputed from lock policy if needed

### View normalization

Importer should normalize:

- `displayName`, `title`, `name`
  - canonical import value should resolve to one display title
- `isViewLocked` and `viewLocked`
  - canonical value is `isViewLocked`

### Lifecycle normalization

Importer must not trust export bundle as a literal lifecycle snapshot.

Importer should assign new lifecycle values for the target tenant, instead of reusing source tenant counters.

At minimum the importer should own:

- model `version`
- model `publishedVersion`
- model `modelStructureVersion`
- view `version`
- view `viewVersion`
- view `publishedVersion`
- view `lastAlignedModelStructureVersion`

If these fields are absent in the bundle, that is acceptable.
If they are present in future exports, importer should still normalize them.

## What importer should ignore

The importer should ignore these fields entirely, or treat them as source-tenant noise:

- `owner`
- `exportedAt`
- any source-tenant publish state
- any source-tenant request/runtime diagnostics
- any source-tenant generated GUIDs if the target persistence layer wants fresh ones

The importer should also ignore UI-only compatibility mirrors if canonical schema already exists elsewhere in the same payload.

Examples:

- model-level compatibility `fields` array if `dataSchema` is already present
- legacy `rootView` compatibility mirror if `uiSchema.rootScope` is already present

## Runtime import policy

### Managed models

For `sourceType = managed`, the current bundle is sufficient.

Importer should:

1. persist model + views into `ps_model` and `ps_view`
2. preserve canonical schemas
3. run backend runtime apply

Managed import does not need source table mapping metadata.

### External or static models

For `sourceType = external` or `static`, the current bundle is not yet sufficient for safe universal import unless runtime/source metadata is already fully portable.

Importer must require:

- complete scope runtime metadata
- complete field-level source mapping when source-backed
- validated dependency availability in target tenant

This is especially important for:

- global reference tables
- tenant-scoped external tables
- lookup fields that depend on other imported/static models

## Dependency policy

The current bundle now exports a basic explicit `dependencies` section.

Current accepted minimum:

- `dependencies.models[]`
- `modelId`
- `required`
- `reasons[]`

This is enough for import preflight to check whether required lookup source models already exist in the target tenant.

Current dependency extraction rules:

- `contact_lookup` -> `users`
- `company_lookup` -> `company`
- `project_lookup` -> `projects`
- generic `lookupConfig.sourceModel` -> that referenced model id

Importer may still use schema inference as a fallback, but `dependencies` is now the primary bundle-level source.

## Required additions before general import implementation

The bundle now includes basic versions of these sections.

What still matters is whether their content is sufficient for the final import workflow.

### 1. `dependencies`

Implemented at minimum and required.

It now enumerates required model dependencies for lookup-backed fields.

This still may need future expansion for batch ordering and optional dependencies.

At minimum:

- required lookup source models
- required preset families
- required static/reference models
- whether the dependency must already exist or may be imported in the same batch

Example shape:

```json
{
  "dependencies": {
    "models": [
      { "modelId": "users", "reasons": ["contact_lookup"], "required": true }
    ]
  }
}
```

### 2. `importPolicy`

Implemented at minimum and required.

Current minimum export policy:

- `conflictMode = reject`

This is enough for the first import slice.
Future slices may add richer conflict handling.

At minimum:

- `reject`
- `overwrite`
- `clone_with_new_key`

### 3. `exportMeta`

Implemented at minimum.

Current minimum export metadata:

- `sourceTenantId`
- `sourceTenantName`
- `exportedBy`
- `exportedAt`

At minimum:

- source tenant id
- source tenant name
- exported by
- export app version or contract version

### 4. `runtimePolicy`

Implemented at minimum.

Current minimum runtime policy:

- `sourceType`
- `onImport`

Current accepted values:

- `managed` -> `reapply_runtime`
- `external/static` -> `validate_runtime_metadata`

This clarifies whether runtime metadata is:

- preserved as-is
- allowed to be regenerated
- required exactly for `external/static`

## Import rules for IDs and keys

Current recommended policy:

- preserve `model.id`
- preserve `model.key`
- preserve `view.id`
- preserve `view.key`

unless the selected conflict policy requires remapping.

If remapping occurs, importer must rewrite:

- `views[].modelId`
- any internal view/schema references that point to those identities

## Import rules for subforms

The current bundle already contains enough subform information because it carries:

- `dataSchema.subformScopes`
- `layoutBlueprint.rootScope.containers`
- `layoutBlueprint.subformScopes`
- `uiSchema.subformScopes`
- root subform anchor nodes in each `uiSchema.rootScope.nodes`

Therefore subforms are considered import-ready in v1 for `managed` models.

## Import-ready minimum for current v1

The current exported JSON is considered import-ready when all of these are true:

- `exportKind = form_builder_model`
- `formatVersion = v1`
- model has canonical `dataSchema`
- model has canonical `layoutBlueprint`
- every view has canonical `uiSchema`
- exactly one default view exists
- all `views[].modelId` match `model.id`
- source type is `managed`

## Current accepted statement

Accepted current rule:

- `Export model` bundle is already sufficient as the source file for future `managed` model import across tenants
- importer must normalize lifecycle/version fields instead of trusting source counters
- importer must ignore source-tenant noise such as owner/audit/export metadata
- current export now includes baseline `dependencies`, `importPolicy`, `exportMeta`, and `runtimePolicy`
- before general `external/static` import is considered complete, those sections may still need richer dependency and portability detail

## Planned follow-up scope

Explicit planned next steps:

- implement `Import model` for `managed` bundles that follow this contract
- implement `Import data` for `managed` models
- make a final product decision for `Export data` semantics:
  - export raw values from the real managed table
  - export human-readable values from the authored/runtime SQL view
  - or support both through separate export actions

## Source-of-truth links

- [form-builder-three-schema-contract.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md)
- [form-builder-schema-cleanup-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md)
- [form-builder-static-models-schema-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md)
- [form-builder-static-lookup-naming-policy-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md)
