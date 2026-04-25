# Static Models Integration v1

Status: exact detail reference
Historical status: accepted
Date: 2026-04-14
Last audited: 2026-04-25
Read rule: Open only after the active Form Builder module docs, and only when exact payload/settings/history detail is needed.
Canonical active docs:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Purpose

This document fixes the first accepted scope for bringing existing database tables into Form Builder as static models.

It defines:

- which existing tables are included in v1
- which table is explicitly excluded from the ordinary model/subform flow
- how static model runtime metadata should point to real physical tables and views
- what migration and implementation steps are required
- how `projectsaccess` should be handled through a dedicated custom widget instead of a normal subform

Companion active module contract:

- `platform/frontend/docs/modules/platform-studio/form-builder.md`

## Accepted Static Model Set

The following existing tables are accepted for Static Models Integration v1:

- `company`
- `companytype`
- `events`
- `jobtype`
- `mails`
- `projects`
- `state`
- `timezone`
- `users`

## Explicitly Excluded From v1

The following table is intentionally excluded from the ordinary Form Builder model/subform contract:

- `projectsaccess`

Reason:

- `projectsaccess` behaves like a join table between `users` and `projects`
- it is not a normal child scope owned by one parent record through `_parent_id`
- it needs a bulk-assignment workflow, not a standard embedded subform editor

## Integration Mode

Static Models Integration v1 uses an external/static source mode.

Accepted behavior:

- Form Builder stores `dataSchema`, `layoutBlueprint`, and `uiSchema` for these models in `ps_model` and `ps_view`
- runtime metadata points to real physical tables and views already present in the tenant database
- backend reuses the external physical table named in `runtime.tableName`
- backend still creates and updates managed canonical data views `vw_*`
- backend still creates and updates managed grid views `vg_*`

Accepted ownership split:

- external/static model: backend does not own the physical source table
- external/static model: backend does own the Form Builder read surfaces `vw_*` and `vg_*`
- managed model: backend owns `ps_*`, `vw_*`, and `vg_*`

## Runtime Contract For Static Models

For static models, runtime metadata still must be present, but it points to the real database objects.

Root `dataSchema.rootScope.runtime` example for `users`:

```json
{
  "rtAlias": "users",
  "tableName": "users",
  "mvTableName": "",
  "dataViewName": "vw_users"
}
```

Accepted rule:

- `tableName` points to the real external source table
- `dataViewName` points to the managed canonical Form Builder read surface
- the canonical data view is built on top of the external source table

Root `uiSchema.rootScope.runtime` example for default view:

```json
{
  "viewRtAlias": "default",
  "dataViewName": "vw_users",
  "gridViewName": "vg_users__default"
}
```

Accepted rule:

- `gridViewName` must be present for static models too
- grid behavior stays aligned with managed models
- the only layer that differs is the source table ownership

## Static Model Access Policy

This requirement is accepted now and implemented later.

Accepted rule:

- only `root` users may see static models in Form Builder
- only `root` users may edit static model views
- only `root` users may edit static model schema

Capability split to preserve:

- `canSeeStaticModels`
- `canEditStaticModelViews`
- `canEditStaticModelSchema`

Delivery rule:

- keep this in the contract now
- implement it only after the admin-panel root-rights path is complete in tenant app

## Accepted v1 Treatment Per Table

### `company`

Purpose:

- lookup source for company references
- editable static model

### `companytype`

Purpose:

- lookup source for company categorization
- initially safe as reference data

### `events`

Purpose:

- business event records
- static model with normal form + grid authoring

### `jobtype`

Purpose:

- reference catalog for job classification

### `mails`

Purpose:

- existing mail records as external/static model

### `projects`

Purpose:

- primary project catalog
- source side for user project assignment widget

### `state`

Purpose:

- lookup/reference source

### `timezone`

Purpose:

- lookup/reference source for timezone selection

### `users`

Purpose:

- core static model
- host for the future project-assignment custom widget

Special field rule:

- the physical password column stays in the `users` table
- it must not be imported into `dataSchema`
- it must not appear in `uiSchema`
- it must not be available as a grid column

## `projectsaccess` Custom Widget Candidate

`projectsaccess` is accepted as a dedicated widget-backed relation manager, not as a normal Form Builder model/subform in v1.

### Host Model

- `users`

### Proposed Custom Field

- `family: "custom"`
- `kind: "custom_widget"`
- `widgetKey: "project_access_manager"`

Example field shape:

```json
{
  "family": "custom",
  "id": "project-access-manager",
  "kind": "custom_widget",
  "label": "Project Access",
  "displayName": "Project Access",
  "fieldId": "project-access-manager",
  "schemaScopeId": "root",
  "storageKey": "project_access_manager",
  "widgetKey": "project_access_manager",
  "status": "persisted"
}
```

### Widget Behavior

The widget should render on the `users` form and provide:

- a button to open a modal
- a modal grid of `projects`
- current assignment state for the selected user
- bulk assign
- bulk unassign
- optional bulk role/access editing later if `projectsaccess` stores more than presence

### Backend Ownership

The widget backend should operate directly on `projectsaccess`.

Initial operations:

- list projects with current access state for one user
- bulk assign selected projects to one user
- bulk remove selected projects from one user

### Why This Is Better Than A Subform

- it preserves the meaning of `_parent_id` subforms for real child records
- it does not fake a many-to-many relation as an embedded child table
- it gives the UI the correct bulk-assignment workflow
- it is reusable later for other relation-manager widgets

## Required Implementation Steps

The old execution-plan pointer file was deleted after compaction.
Before implementing static-model changes, rewrite the work from current active
Form Builder docs and verify against code.

### Step 1. Lock the static model set

Freeze the initial v1 list:

- `company`
- `companytype`
- `events`
- `jobtype`
- `mails`
- `projects`
- `state`
- `timezone`
- `users`

Keep `projectsaccess` out of the first static migration.

### Step 2. Decide the external runtime mode contract

Backend must explicitly support static/external models.

Required rules:

- `sourceType = "external"` or `sourceType = "static"`
- runtime metadata is still stored in canonical payloads
- runtime apply must reuse the external source table
- runtime apply must still create/update `vw_*`
- runtime apply must still create/update `vg_*`
- save and debug paths must preserve runtime metadata exactly

### Step 3. Create migration that seeds model and default view metadata

For each accepted table:

- create or upsert `ps_model`
- create or upsert one default `ps_view`
- write canonical `definition_json`
- include runtime metadata that points to the real table and the managed Form Builder views

Each seeded model needs:

- `dataSchema`
- `layoutBlueprint`
- default `uiSchema`
- `viewSettings.list.columns`
- runtime blocks on root data scope and root UI scope

### Step 4. Build the first schema map for every table

For each table:

- map DB columns to Form Builder field kinds
- decide labels and storage keys
- identify lookups
- identify read-only/system columns that should not become editable business fields
- exclude sensitive columns that must never enter Form Builder schema

Explicit v1 exclusion:

- `users.password`

This step should produce a canonical field map per table before migration JSON is generated.

### Step 5. Build the default UI schema for each static model

For each seeded table:

- define the form canvas node order
- define the default grid columns
- define visible versus hidden grid columns
- define actions: `canAdd`, `canEdit`, `canDelete`, `canView`

This should be explicit per model, not inferred ad hoc in runtime code.

### Step 6. Define lookup relationships between static models

Before seeding final JSON, confirm which fields are lookups between:

- `company` and `companytype`
- `users` and `company`
- `users` and `timezone`
- `projects` and `company`
- any other existing foreign-key links in the accepted static-model set

These must be represented in `dataSchema` so grid/form behavior is stable from day one.

### Step 7. Add static models to the accepted registry

Update the Form Builder accepted registry so these models are explicitly recognized as static/external models and not treated as ad hoc exceptions.

### Step 8. Smoke test the static models

For each seeded model verify:

- model opens in Form Builder
- debug shows runtime metadata
- default form renders
- grid renders
- save preserves runtime metadata
- no managed `ps_*` runtime tables are generated for the external model path
- managed `vw_*` and `vg_*` are generated and refreshed correctly

### Step 9. Design and implement the `project_access_manager` widget

This is a separate stream after the first static-model migration.

Required slices:

1. field contract
2. backend query/mutation endpoints for `projectsaccess`
3. modal grid UI
4. bulk assign/unassign actions
5. embedding into `users` form

## Recommended Delivery Order

Accepted order:

1. external/static model backend contract
2. migration for the accepted static models
3. smoke test and contract fixes
4. `users` custom widget contract
5. `projectsaccess` bulk-assignment widget implementation

## Immediate Next Deliverables

The next concrete outputs should be:

1. migration plan for the static models
2. per-table field mapping draft
3. default UI schema draft for each table
4. separate widget contract for `project_access_manager`

## Non-Goals For This Slice

This slice does not yet include:

- importing `projectsaccess` as a normal model
- treating `projectsaccess` as a subform
- a generic many-to-many builder for arbitrary tables
- backward compatibility with older runtime naming
