# Platform Studio Form Builder Backend Contract

Status: active
Owner: backend
Last audited: 2026-05-07
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
- static/external access policy and authoring locks
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

- `GET /app/platform-studio/forms/catalog`
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

`GET /app/platform-studio/forms/catalog` is the batch authoring catalog for
Platform Studio shells that need model and view labels together, including
Navigation Builder Form View target pickers. It returns `ModelSummary` records
with embedded `views` summaries and must avoid per-model HTTP view waterfalls.

Legacy authoring aliases:

- `GET /app/platform-studio/forms/models/{modelId}/views/{viewId}/draft`
- `PUT /app/platform-studio/forms/models/{modelId}/views/{viewId}/draft`

Export routes:

- `GET /app/platform-studio/forms/models/{modelId}/export/model`
- `GET /app/platform-studio/forms/models/{modelId}/export/data`

Shared tenant dictionary routes:

- `GET /app/dictionaries/{dictionaryKey}/options`
- `POST /app/dictionaries/options/query`

The tenant dictionary module is a shared lookup option source for Form Builder
authoring and future Form render lookup controls. It returns paged options with
`id`, `value`, `label`, optional `description`, and optional string `fields`.
The named `GET` route supports `search`, repeated `ids`, `page`, and `pageSize`
query parameters. Current named dictionaries are `companies`, `companyTypes`,
`contacts`, `jobtypes`, and `projects`, with aliases accepted for
singular/preset-facing names. The generic `POST` route supports ordinary lookup
sources by accepting `sourceModel`, `displayFields`, `searchFields`,
`sortField`, `storedValueField`, `filters[]`, `search`, `ids`, `page`, and
`pageSize`; filters use the Form Builder lookup filter shape (`field`,
`operator`, `value`). The route currently uses tenant-secure baseline access
only; lookup-specific access rules remain a separate future decision.

Authoring access baseline:

- authoring routes use the tenant-secure route baseline
- authenticated tenant members may create, edit, and delete unlocked managed
  models
- readonly users cannot mutate authoring state
- locked model/view state is enforced on save
- static/external model structure remains read-only
- root/non-root distinction currently matters for lock changes and locked
  model/view behavior, not for unlocked managed model structure editing

## Runtime And Preview Routes

Real runtime API namespace:

- `GET /app/me/favorites`
- `GET /app/forms/{modelId}/views/{viewId}/meta`
- `POST /app/forms/{modelId}/views/{viewId}/query`
- `GET /app/forms/{modelId}/views/{viewId}/search-suggestions`
- `POST /app/forms/{modelId}/views/{viewId}/saved-filters`
- `DELETE /app/forms/{modelId}/views/{viewId}/saved-filters/{savedFilterId}`
- `POST /app/forms/{modelId}/views/{viewId}/bulk-actions/{actionId}`
- `GET /app/forms/{modelId}/views/{viewId}/records/{docGuid}`
- `GET /app/forms/{modelId}/views/{viewId}/form`
- `GET /app/forms/{modelId}/views/{viewId}/records/{docGuid}/form`
- `POST /app/forms/{modelId}/views/{viewId}/records`
- `PATCH /app/forms/{modelId}/views/{viewId}/records/{docGuid}`
- `POST /app/forms/{modelId}/views/{viewId}/records/{docGuid}/finish`
- `POST /app/forms/{modelId}/views/{viewId}/favorite/toggle`

Runtime record mutation contract:

- form read response:
  `{ dataSchema: Record<string, unknown>, description?: string, docGuid?: string, modelId: string, recordId?: string, revision?: string, sourceType?: string, surfaceId: string, title: string, uiSchema: Record<string, unknown>, values: Record<string, unknown>, viewId: string }`
- `recordId` is the current source-table record id from the compiled runtime
  `sourceIdColumn`; it is not the route `docGuid`
- form read response must include the current option for single-value
  `contact_lookup` fields when the record/default values contain an id, so
  readonly and editable lookup controls can render a display label without a
  separate initial lookup request
- create request: `{ clientCreateToken?: string, values: Record<string, unknown> }`
- edit/autosave request: `{ expectedRevision?: string, values: Record<string, unknown> }`
- finish request: `{ expectedRevision?: string }`
- create/edit/finish response:
  `{ created?: boolean, docGuid?: string, recordId?: string, revision?: string, status?: string, validationErrors?: Array<{ fieldId?: string, message: string }>, values: Record<string, unknown> }`
- create validates required root fields before insert and returns `validationErrors`
  in an otherwise successful API response when the record is not yet created
- create applies bound System Field defaults server-side when compatible:
  Reported By, Reported Date, and workflow initial status
- edit/autosave patches only provided field values on an existing root record
- finish is a command boundary; the current implementation applies the bound
  workflow final status when valid and leaves future Action Builder side
  effects out of this route
- `clientCreateToken` is part of the adapter contract for a stable create
  session key; when it is a UUID and the source exposes a GUID column, create
  inserts it as the record GUID and duplicate-token unique violations return
  the existing record instead of creating another one
- bulk action request follows the Collection Table shape:
  `{ query, rowIds: string[] }`; current supported runtime actions are
  `active`, `inactive`, and `delete`
- `active` / `inactive` require `canEdit`, a compatible boolean source/schema
  field whose runtime source column is `active`, and that field must be present
  and visible in the current view list output
- `delete` requires `canDelete` and physically deletes the selected records by
  record GUID; it is independent of whether an `active` field exists. Managed
  subform rows are removed before root rows when their runtime child table is
  known, so existing child foreign keys do not block the root delete.

Runtime list action metadata:

- toolbar create/`Start New` is visible when the view allows `canAdd` and the
  runtime source exposes a record GUID
- frontend row actions expose `edit` before `view` when both are allowed; both
  require record GUID support
- checkbox selection and bulk actions are emitted only when the runtime source
  exposes record GUIDs and at least one current-view bulk action is available
- `Active` / `No active` bulk buttons are emitted only when the current list
  output includes a supported `active` field and the view allows edit
- `Delete` is emitted when the view allows delete and includes confirmation
  metadata for the generic Collection Table confirmation dialog
- `rowLayout.secondaryRowFieldId` may be emitted for one configured root-list
  field. That field remains in query/search metadata, is omitted from header
  column metadata, and must resolve to an existing grid projection. Lookup
  fields resolve through their grid label/output alias rather than physical
  lookup id columns.
- Generic lookup labels built from authored display fields use comma-separated
  plain text (`first, second`) and lookup label cells may mark
  `displayFormat = leading_comma_bold` so the generic Collection Table renderer
  can emphasize the leading value without backend HTML. Existing compiled
  runtime SQL views pick up label-expression changes only after runtime apply
  recreates the view, such as an authoring save/open path that applies runtime.

Platform Studio preview API namespace:

- `GET /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/meta`
- `POST /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/query`
- `GET /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/search-suggestions`
- `POST /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/saved-filters`
- `DELETE /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/saved-filters/{savedFilterId}`
- `GET /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{docGuid}`
- `POST /app/platform-studio/forms/{modelId}/views/{viewId}/runtime/favorite/toggle`

Preview runtime metadata suppresses bulk actions because preview routes must not
mutate real runtime data.

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
- `is_active` (deprecated compatibility metadata; Form Builder view config no
  longer owns runtime/sidebar exposure)
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

`ps_view.definition_json` does not own runtime/sidebar exposure. Deprecated
`isActive` values from older drafts may be tolerated on load, but new Form
Builder authoring saves must not persist `isActive` in view config. Navigation
Builder owns exposure for `{ targetType: form_builder_view, modelId, viewId }`.

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
- enforce static/external read-only rules and root/non-root actor lock rules
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
- managed `multi_select`/`tags` values are stored in the generated scope multivalue table with `value_kind = 'option'`, `value_key` as the authored option value, and `value_label` as the authored option label fallbacking to the value

Current tenant static/external Form Builder seed coverage includes canonical
reference and business models for `state`, `timezone`, `companytype`,
`jobtype`, `events`, `mails`, `users`, `company`, `projects`,
`industry_size`, and `industry_type`.

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
- authoring stores checklist bindings as `checklistConfig` on the checklist subform UI node and layout blueprint container, including `lookupFieldId`, `resultFieldId`, optional `notesFieldId`, and grouping; backend normalization preserves that config when deriving or materializing UI schema
- runtime/form render may auto-detect optional item-source metadata fields by storage key from the lookup source selected by the checklist `Item` DB lookup: `answer_options` (`|`-delimited answer buttons such as `Pass|Fail|N/A`), `answer_required` (boolean per-question required flag), and `visible_when` (one simple dependency expression such as `7=Fail`); missing fields keep default checklist behavior and no Form Builder field-mapping UI is required for this first contract

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

Current backend packages:

- `platformstudioformbuilder`
- `platformstudioformruntime`

`platformstudioformbuilder` remains the authoring/control-plane owner and still contains early runtime list/read scaffolding.
`platformstudioformruntime` owns the runtime record write boundary for create/edit/finish and runtime bulk actions.

Future package direction:

- `platformstudioformruntime`: continue moving runtime list/read/query/filter/sort/page/row actions and record repositories out of `platformstudioformbuilder`.
- `platformstudioformactions`: after-save hooks, notifications, integrations, workflow triggers, async side effects, retries, and failure reporting.

Do not expand `platformstudioformbuilder` into a catch-all package for every Platform Studio tool.

## Open Follow-Ups

- Implement dedicated Navigation Builder runtime grants for `/app/forms/...`.
- Implement dedicated Platform Studio preview access guard for `/app/platform-studio/forms/.../runtime/*`.
- Implement managed model/data import routes and services; export bundle support exists, but import is not active.
- Decide final managed `Export data` semantics.
- Static/external multivalue storage remains deferred; managed non-lookup `multi_select`/`tags` and multiple lookup fields use generated bridge tables.
- Finish extraction path for larger runtime record/list behavior.
- Keep backend API/storage/migration detail here, not in frontend Platform Studio docs.
