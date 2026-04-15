# Static Models Migration Draft v1

Status: draft
Date: 2026-04-15

## Purpose

This document defines the draft for the first tenant migration that seeds Form Builder metadata for the accepted static models.

This is a draft only.

It is not yet an active SQL migration because per-table field maps are still pending.

## Target Migration Slot

Suggested future tenant migration file:

- `043_platform_studio_static_models_seed.sql`

This number is provisional until the next migration is finalized.

## Accepted Scope

The migration will seed Form Builder metadata for:

- `company`
- `companytype`
- `events`
- `jobtype`
- `mails`
- `projects`
- `state`
- `users`

The migration will not seed:

- `projectsaccess`

## Ownership Model

For these models:

- physical source tables already exist
- Form Builder will reuse the source table named in `runtime.tableName`
- Form Builder will create and own `vw_*`
- Form Builder will create and own `vg_*`

The migration must not create or modify the source tables themselves.

## What The Migration Will Seed

For each accepted table:

1. one `ps_model` row
2. one or more initial `ps_view` rows
3. canonical `definition_json` for model
4. canonical `definition_json` for each seeded view
5. runtime blocks for root `dataSchema` and root `uiSchema`

Special case:

- `users` requires two initial views, not one:
  - `Contacts`
  - `List of Accounts`

## Runtime Targets Per Static Model

### `company`

- `tableName = company`
- `dataViewName = vw_company`
- `gridViewName = vg_company__default`

### `companytype`

- `tableName = companytype`
- `dataViewName = vw_companytype`
- `gridViewName = vg_companytype__default`

### `events`

- `tableName = events`
- `dataViewName = vw_events`
- `gridViewName = vg_events__default`

### `jobtype`

- `tableName = jobtype`
- `dataViewName = vw_jobtype`
- `gridViewName = vg_jobtype__default`

### `mails`

- `tableName = mails`
- `dataViewName = vw_mails`
- `gridViewName = vg_mails__default`

### `projects`

- `tableName = projects`
- `dataViewName = vw_projects`
- `gridViewName = vg_projects__default`

### `state`

- `tableName = state`
- `dataViewName = vw_state`
- `gridViewName = vg_state__default`

### `users`

- `tableName = users`
- `dataViewName = vw_users`
- `gridViewName = vg_users__default` for `Contacts`
- `gridViewName = vg_users__accounts` for `List of Accounts`

Detailed field-map draft:

- [form-builder-static-models-users-field-map-draft-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-users-field-map-draft-v1.md)

## Required Root Runtime Blocks

`dataSchema.rootScope.runtime` example:

```json
{
  "rtAlias": "users",
  "tableName": "users",
  "mvTableName": "",
  "dataViewName": "vw_users"
}
```

`uiSchema.rootScope.runtime` example:

```json
{
  "viewRtAlias": "default",
  "dataViewName": "vw_users",
  "gridViewName": "vg_users__default"
}
```

## External System Column Mapping Draft

These mappings are required so runtime apply can build `vw_*` over external tables.

### `company`

- `_id -> company_id`
- `tenant_id -> company_tenant_id`
- `_guid -> company_guid`
- `_created_at -> company_created_at`
- `_updated_at -> company_updated_at`

### `companytype`

- `_id -> companytype_id`
- `tenant_id -> companytype_tenant_id`
- `_guid -> companytype_guid`
- `_created_at -> companytype_created_at`
- `_updated_at -> companytype_updated_at`

### `events`

- `_id -> events_id`
- `tenant_id -> events_tenant_id`
- `_guid -> events_guid`
- `_created_at -> events_created_at`
- `_updated_at -> events_updated_at`

### `jobtype`

- `_id -> jobtype_id`
- `tenant_id -> tenant_id`
- `_guid -> jobtype_guid`
- `_created_at -> jobtype_created_at`
- `_updated_at -> jobtype_updated_at`

### `mails`

- `_id -> mails_id`
- `tenant_id -> mails_tenant_id`
- `_guid -> NULL::uuid`
- `_created_at -> mails_created_at`
- `_updated_at -> mails_updated_at`

### `projects`

- `_id -> projects_id`
- `tenant_id -> projects_tenant_id`
- `_guid -> projects_guid`
- `_created_at -> projects_created_at`
- `_updated_at -> projects_updated_at`

Note:

- confirm `projects_created_at` and `projects_updated_at` in the source table during field-map pass

### `state`

- `_id -> state_id`
- `tenant_id -> NULL::bigint`
- `_guid -> NULL::uuid`
- `_created_at -> NULL::timestamptz`
- `_updated_at -> NULL::timestamptz`

### `users`

- `_id -> users_id`
- `tenant_id -> users_tenant_id`
- `_guid -> users_guid`
- `_created_at -> users_created_at`
- `_updated_at -> users_updated_at`

Special rule:

- `users_password` stays in the physical table
- it must not be added to `dataSchema.fields`
- it must not be added to `uiSchema`
- `users` also seeds two initial views:
  - `Contacts` as default
  - `List of Accounts` as secondary `accounts`

## Draft Migration Shape

The future SQL migration should follow this pattern for each model.

Pseudo-SQL:

```sql
INSERT INTO ps_model (
  guid,
  model_id,
  model_key,
  storage_key,
  display_name,
  description,
  source_type,
  status,
  version,
  published_version,
  structure_version,
  model_locked,
  definition_json
)
VALUES (
  gen_random_uuid(),
  '<model-id>',
  '<model-key>',
  '<storage-key>',
  '<display-name>',
  '',
  'external',
  'draft',
  1,
  0,
  1,
  false,
  '<canonical model json>'
)
ON CONFLICT (model_id) DO UPDATE
SET
  model_key = EXCLUDED.model_key,
  storage_key = EXCLUDED.storage_key,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  source_type = EXCLUDED.source_type,
  definition_json = EXCLUDED.definition_json,
  updated_at = now();
```

```sql
INSERT INTO ps_view (
  guid,
  model_id,
  view_id,
  view_key,
  display_name,
  description,
  view_type,
  is_default,
  is_active,
  view_locked,
  status,
  version,
  published_version,
  last_aligned_model_structure_version,
  definition_json,
  published_artifacts_json
)
VALUES (
  gen_random_uuid(),
  '<model-id>',
  'view-default',
  'default',
  '<display-name>',
  '',
  'form',
  true,
  true,
  false,
  'draft',
  1,
  0,
  1,
  '<canonical default view json>',
  '{}'::jsonb
)
ON CONFLICT (model_id, view_id) DO UPDATE
SET
  view_key = EXCLUDED.view_key,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  view_type = EXCLUDED.view_type,
  is_default = EXCLUDED.is_default,
  is_active = EXCLUDED.is_active,
  view_locked = EXCLUDED.view_locked,
  definition_json = EXCLUDED.definition_json,
  updated_at = now();
```

## Migration Preconditions

Before turning the draft into a live SQL migration, we need:

1. exact field map for each table
2. exact default grid columns for each model
3. exact lookup relationships between the 8 static models
4. explicit exclusion list for sensitive or internal columns

## Immediate Decisions Already Locked

These points are already fixed and do not need reopening:

1. static models use `sourceType = external`
2. source tables are reused
3. `vw_*` and `vg_*` remain managed by Form Builder
4. `projectsaccess` stays out of the migration
5. `users_password` is excluded from the schema

## Next Step After This Draft

The next working pass should be the per-table field map:

1. `company`
2. `companytype`
3. `events`
4. `jobtype`
5. `mails`
6. `projects`
7. `state`
8. `users`
