# Platform Studio Form Builder Backend Contract

Status: active
Owner: backend
Last audited: 2026-04-25
Canonical scope: backend-owned Form Builder authoring API, metadata storage, runtime apply, generated runtime objects, validation, and migration boundaries

This contract is the backend source of truth for the active Form Builder backend boundary.
It compacts backend-owned facts from older frontend-owned backend handoff docs and aligns them with current backend code.

Read with:

- `platform/backend/docs/modules/platform-studio/form-builder.md`
- `platform/backend/docs/contracts/runtime-wiring.md`
- `platform/backend/docs/contracts/migrations.md`
- `platform/backend/docs/contracts/schema-tenancy.md`

## Code Owners

Runtime wiring:

- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- `platform/backend/cmd/api-tenant/internal/server/wiring_platform_studio_form_builder.go`

Backend module:

- `platform/backend/modules/tenant/platformstudioformbuilder`

Tenant schema:

- `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`
- `platform/backend/bundle/tenant_schema_full.sql`

Frontend contract companion:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`

## Historical Frontend Inputs

This contract supersedes the active-read role of these older frontend docs.
Those frontend-owned backend-facing pointer files were deleted after compaction.

Use git history only when auditing exact old text.

## Current Backend Boundary

Form Builder backend owns:

- tenant-scoped authoring APIs
- `ps_model` and `ps_view` persistence
- stable model/view identity resolution
- authoring normalization, compatibility, validation, and compaction
- optimistic concurrency through expected model/view versions
- root/static access policy and authoring locks
- runtime metadata derivation
- additive runtime apply
- generated table/view/index/trigger/foreign-key orchestration
- runtime list/read scaffolding currently still inside `platformstudioformbuilder`
- managed export model/data behavior

Form Builder backend does not own:

- site publication as a user-facing lifecycle
- sidebar/navigation composition
- runtime grants and exposure assignment
- post-submit actions, notifications, integrations, or workflows
- PDF template generation
- report generation

Those belong to future Platform Studio tools or future backend packages unless a later accepted contract changes the boundary.

## Lifecycle

Current accepted lifecycle:

1. Load authoring state.
2. Save authoring state.
3. Run additive runtime apply from the same save flow.
4. Return authoring state plus runtime apply summary.

Rules:

- `Save` is authoring persistence plus additive runtime apply.
- `Save` is not site publication.
- The older `publishBuilderDraft` concept is superseded and must not be reintroduced as the active product-facing lifecycle.
- `/authoring` is canonical transport naming.
- `/draft` is a legacy compatibility alias only.
- If runtime apply fails after authoring persistence succeeds, persisted authoring state remains authoritative.
- Runtime apply failure must be returned separately from authoring-save failure.

## Authoring Routes

Current Platform Studio authoring API routes:

- `GET /app/platform-studio/forms/models`
- `POST /app/platform-studio/forms/models`
- `GET /app/platform-studio/forms/models/{modelId}`
- `DELETE /app/platform-studio/forms/models/{modelId}`
- `GET /app/platform-studio/forms/models/{modelId}/views`
- `POST /app/platform-studio/forms/models/{modelId}/views`
- `GET /app/platform-studio/forms/models/{modelId}/views/{viewId}`
- `POST /app/platform-studio/forms/models/{modelId}/views/{viewId}/copy`
- `DELETE /app/platform-studio/forms/models/{modelId}/views/{viewId}`
- `GET /app/platform-studio/forms/models/{modelId}/views/{viewId}/authoring`
- `PUT /app/platform-studio/forms/models/{modelId}/views/{viewId}/authoring`

Legacy authoring aliases:

- `GET /app/platform-studio/forms/models/{modelId}/views/{viewId}/draft`
- `PUT /app/platform-studio/forms/models/{modelId}/views/{viewId}/draft`

Export routes:

- `GET /app/platform-studio/forms/models/{modelId}/export/model`
- `GET /app/platform-studio/forms/models/{modelId}/export/data`

## Runtime And Preview Routes

Real runtime API namespace:

- `GET /app/me/favorites`
- `GET /app/forms/{modelId}/views/{viewId}/meta`
- `POST /app/forms/{modelId}/views/{viewId}/query`
- `GET /app/forms/{modelId}/views/{viewId}/search-suggestions`
- `POST /app/forms/{modelId}/views/{viewId}/saved-filters`
- `DELETE /app/forms/{modelId}/views/{viewId}/saved-filters/{savedFilterId}`
- `GET /app/forms/{modelId}/views/{viewId}/records/{docGuid}`
- `POST /app/forms/{modelId}/views/{viewId}/favorite/toggle`

Platform Studio preview API namespace:

- `GET /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/meta`
- `POST /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/query`
- `GET /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/search-suggestions`
- `POST /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/saved-filters`
- `DELETE /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/saved-filters/{savedFilterId}`
- `GET /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{docGuid}`
- `POST /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/favorite/toggle`

Access rules:

- Real runtime routes are future Navigation Builder runtime context.
- Preview routes are Platform Studio authoring preview context.
- Route namespace defines access context.
- Do not add a second target type or request `source` flag.
- Until Navigation Builder ACL lands, runtime routes remain on the current tenant-auth baseline.
- Future runtime grants must attach to target `{ targetType: form_builder_view, modelId, viewId }`.

## Metadata Tables

`ps_model` is the model authoring/control table.

Current tenant baseline columns:

- `id`
- `guid`
- `model_id`
- `model_key`
- `storage_key`
- `display_name`
- `description`
- `source_type`
- `status`
- `version`
- `published_version`
- `structure_version`
- `definition_json`
- `model_locked`
- `created_at`
- `updated_at`

Current indexes/triggers:

- unique `model_id`
- unique `guid`
- `updated_at` index
- `set_updated_at()` trigger

`ps_view` is the authored view/control table.

Current tenant baseline columns:

- `id`
- `guid`
- `model_id`
- `view_id`
- `view_key`
- `display_name`
- `description`
- `view_type`
- `is_default`
- `is_active`
- `status`
- `version`
- `published_version`
- `last_aligned_model_structure_version`
- `definition_json`
- `published_artifacts_json`
- `view_locked`
- `created_at`
- `updated_at`

Current indexes/triggers:

- unique `(model_id, view_id)`
- unique `guid`
- `model_id` index
- `updated_at` index
- `set_updated_at()` trigger

## Schema Ownership

`ps_model.definition_json` owns:

- `dataSchema`
- `layoutBlueprint`
- model metadata
- model lock state
- model structure version
- field persisted/fixed state
- runtime metadata for data scopes

`ps_view.definition_json` owns:

- `uiSchema`
- view metadata
- view settings
- filter definitions
- view lock state
- `lastAlignedModelStructureVersion`
- runtime metadata for view/grid scopes

Backend must not treat `ps_model` or `ps_view` as business-data tables.
Generated business/runtime data lives in separate runtime objects.

## Identity

Authoring API path params:

- `modelId`
- `viewId`

Rules:

- `modelId` resolves stable `ps_model.model_id`.
- `viewId` resolves stable `ps_view.view_id`.
- Do not fall back from `viewId` to `view_key`.
- `view_key` may remain useful for default-view semantics and runtime alias generation.
- `guid` is database identity and must not replace stable authoring path identity.
- display names/titles must not be used as identity.

Runtime record identity:

- public record routes use `docGuid`
- internal numeric ids and runtime `_id` are not public route identity

## Authoring API Payloads

Save request:

```json
{
  "expectedVersions": {
    "model": 1,
    "view": 1
  },
  "draft": {
    "model": {},
    "view": {}
  }
}
```

Load/save response:

```json
{
  "draft": {
    "model": {},
    "view": {}
  },
  "publishState": {},
  "validationSummary": {},
  "runtimeApply": {}
}
```

Compatibility note:

- `publishState` remains a response field for runtime-alignment compatibility.
- It must not be interpreted as an active user-facing publish workflow.

Expected version rules:

- stale model version returns conflict
- stale view version returns conflict
- conflicts must not silently overwrite persisted state

## Save Semantics

On save, backend must:

- decode and validate `draft.model`
- decode and validate `draft.view`
- reject mismatched path/body model or view identity
- load current model/view
- enforce static/external read-only structure rules
- enforce root/non-root actor lock rules
- normalize model payload for default view when model structure is editable
- normalize view payload against `dataSchema + layoutBlueprint`
- validate runtime relation conflicts before persistence
- update only changed version surfaces
- increment `structure_version` only when model-owned structure changes
- set `last_aligned_model_structure_version` on the saved view
- persist model then view with expected-version checks
- propagate default-view canonical field label renames to other views when needed
- build response from persisted state
- run additive runtime apply
- attach runtime apply summary or warning

Non-default views must not silently mutate model-owned schemas.

## Runtime Naming

Current naming follows the active runtime naming contract.

Generated runtime aliases:

- model alias: max 29 chars
- scope alias: short `sf_<hash>` form
- view alias: max 12 chars, `default` remains `default`

Generated runtime object prefixes:

- physical managed tables: `ps_`
- canonical data views: `vw_`
- grid views: `vg_`

Examples:

- root table: `ps_<model.rtAlias>`
- subform table: `ps_<model.rtAlias>__<scope.rtAlias>`
- root multivalue table: `ps_<model.rtAlias>__mv`
- subform multivalue table: `ps_<model.rtAlias>__<scope.rtAlias>__mv`
- root canonical data view: `vw_<model.rtAlias>`
- subform canonical data view: `vw_<model.rtAlias>__<scope.rtAlias>`
- root grid view: `vg_<model.rtAlias>__<view.rtAlias>`
- subform grid view: `vg_<model.rtAlias>__<scope.rtAlias>__<view.rtAlias>`

Older `vw_ps_*` examples in historical docs are superseded.

## Runtime Metadata

Backend generates missing runtime metadata during save and reuses it after generation.

`dataSchema` runtime blocks live on:

- `dataSchema.rootScope.runtime`
- `dataSchema.subformScopes[].runtime`

They include storage/query objects such as:

- `rtAlias`
- `tableName`
- `mvTableName`
- `dataViewName`
- source system column mapping for external/static scopes

`uiSchema` runtime blocks live on:

- `uiSchema.rootScope.runtime`
- `uiSchema.subformScopes[].runtime`

They include view/query objects such as:

- `viewRtAlias`
- `dataViewName`
- `gridViewName`

Backend must not overwrite logical keys with physical runtime names.

## Runtime Apply

Runtime apply runs after successful authoring persistence.

Managed runtime apply may:

- create missing root managed table
- create missing subform managed tables
- create missing multivalue bridge tables when needed
- add missing supported columns
- add parent foreign key column for subforms
- add backend-owned tenant/GUID/parent/lookup indexes
- add updated-at triggers on managed tables
- create or recreate canonical data views
- create or recreate grid views
- generate lookup-derived outputs in SQL views

Runtime apply must not:

- delete physical tables
- delete physical columns
- perform destructive field/table renames
- move persisted fields across scopes with data migration
- treat SQL-view-only lookup outputs as editable model fields
- roll back already persisted authoring state when runtime apply fails

Runtime apply result shape includes:

- status
- message
- tenant/model/view context
- root scope object results
- subform scope object results
- per-field warnings

## Source Types

Supported source type concepts:

- `managed`: backend owns generated physical storage and read/query views.
- `external` / `static`: backend maps to existing source tables and keeps model structure read-only.

Static/external behavior:

- structure is read-only
- root may manage views when allowed
- export model/data actions are unsupported
- runtime apply may reuse compatible existing source table
- source system columns must be explicit or resolved
- multivalue bridge tables are not supported for non-managed sources unless a later contract adds that path

## Generated Object Rules

Managed root scope:

- table: create/reuse/additive alter
- canonical data view: create/recreate
- grid views: create/recreate
- lookup outputs: create/recreate in SQL views

Managed `DEFAULT` subform:

- child table: create/reuse/additive alter
- parent foreign key: create/reuse
- canonical data view: create/recreate
- grid views: create/recreate
- lookup outputs: create/recreate in SQL views

Managed `CHECKLIST` subform:

- child table: create/reuse/additive alter
- parent foreign key: create/reuse
- canonical data view: create/recreate
- lookup outputs: create/recreate in SQL views
- child grid views: skipped

External/static root:

- source table: reuse only
- data/grid views: create/recreate only when backend mapping supports the source
- child managed storage: unsupported until a later contract explicitly adds it

## Validation

Backend is final authority for:

- JSON shape
- required contract keys
- stable model/view identity
- scope id uniqueness
- field id uniqueness
- stable key presence
- root-only concerns staying on root scope
- node binding correctness
- model/view lock enforcement
- static/external structure read-only enforcement
- optimistic concurrency
- runtime relation collisions
- storage object compatibility
- generated SQL view compilation

Current error families map to:

- unauthorized
- tenant missing
- invalid payload
- delete unsupported
- export unsupported
- model structure read-only
- model locked
- view locked
- draft version conflict
- model not found
- view not found
- record not found
- record view requires GUID-enabled source
- cannot delete last view

## Migration Policy

Ordinary save/runtime apply is additive-only.

Allowed:

- create new managed model storage
- add supported nullable/compatible columns
- add new managed subform table
- add new child field
- recreate deterministic SQL views
- add lookup-derived SQL-view outputs
- update layout, filters, grid config, rules, and system-field bindings when storage-compatible

Rejected/deferred:

- delete published physical column
- delete published child table
- rename physical column
- rename root/subform table
- incompatible physical type change
- move persisted fields between scopes
- convert persisted subform storage semantics
- backfill non-nullable fields from existing data
- destructive migration workflow

Future explicit migration mode may later own destructive or data-preserving transformations.
It is not active today.

## Package Boundary

Current transitional backend package:

- `platformstudioformbuilder`

It remains the authoring/control-plane owner and currently contains early runtime list/read scaffolding.

Future package direction:

- `platformstudioformruntime`: runtime list/read/create/edit/save records, runtime query/filter/sort/page/row actions, and record repositories.
- `platformstudioformactions`: after-save hooks, notifications, integrations, workflow triggers, async side effects, retries, and failure reporting.

Do not expand `platformstudioformbuilder` into a catch-all package for every Platform Studio tool.

## Open Follow-Ups

- Implement dedicated Navigation Builder runtime grants for `/app/forms/...`.
- Implement dedicated Platform Studio preview access guard for `/app/platform-studio/forms/.../runtime/*`.
- Implement managed model/data import routes and services; export bundle support exists, but import is not active.
- Decide final managed `Export data` semantics.
- Implement non-lookup `multi_select`/`tags` storage in an explicit slice; multiple lookup bridge-table support already exists.
- Finish extraction path for larger runtime record/list behavior.
- Keep backend API/storage/migration detail here, not in frontend Platform Studio docs.
