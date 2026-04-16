# Static Models Migration Draft v1

Status: partially implemented
Date: 2026-04-15

## Purpose

This document defines the tenant-migration plan for seeding Form Builder metadata for the accepted static models.

Implemented first slice:

- active tenant migration:
  - `platform/backend/migrations/postgres/tenant/001_platform_studio_static_models_seed_reference_and_logs.sql`
- seeded subset:
  - `state`
  - `timezone`
  - `companytype`
  - `jobtype`
  - `events`
  - `mails`

Still pending in follow-up migration work:

- `company`
- `projects`
- `users`

## Target Migration Slot

The first active slot is now:

- `001_platform_studio_static_models_seed_reference_and_logs.sql`

Additional tenant migration slots are still required for the remaining static models.

## Accepted Scope

The migration will seed Form Builder metadata for:

- `company`
- `companytype`
- `events`
- `jobtype`
- `mails`
- `projects`
- `state`
- `timezone`
- `users`

The migration will not seed:

- `projectsaccess`

Current implementation note:

- the active `001_*` migration seeds only the implemented subset listed above
- the remaining accepted tables stay in this document as pending follow-up scope

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

- `users` requires three initial views, not one:
  - `Users`
  - `Contacts`
  - `List of Accounts`

Companion frozen schema contract:

- [form-builder-static-models-schema-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md)

Current exclusions in the active `001_*` migration:

- `events.data` is excluded from seeded `dataSchema`
- `events.files` is excluded from seeded `dataSchema`
- `events.urls` is excluded from seeded `dataSchema`
- `mails.files` is excluded from seeded `dataSchema`
- `mails.urls` is excluded from seeded `dataSchema`

Reason:

- the accepted first-slice static-model field contract does not yet define a canonical JSON authoring field kind for these external JSONB payload columns

Active naming shape in the bundled `001_*` seed:

- `events.user_id` source column is now modeled as logical lookup field `user`
- `mails.user_id` source column is now modeled as logical lookup field `user`
- `runtime.sourceColumnName` remains `user_id`

Companion naming policy:

- [form-builder-static-lookup-naming-policy-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md)

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

### `timezone`

- `tableName = timezone`
- `dataViewName = vw_timezone`
- `gridViewName = vg_timezone__default`

### `users`

- `tableName = users`
- `dataViewName = vw_users`
- `gridViewName = vg_users__default` for `Users`
- `gridViewName = vg_users__contacts` for `Contacts`
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
  "dataViewName": "vw_users",
  "sourceIdColumn": "id",
  "sourceTenantIdColumn": "tenant_id",
  "sourceGuidColumn": "guid",
  "sourceCreatedAtColumn": "created_at",
  "sourceUpdatedAtColumn": "updated_at"
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

- `_id -> id`
- `tenant_id -> tenant_id`
- `_guid -> guid`
- `_created_at -> created_at`
- `_updated_at -> updated_at`

### `companytype`

- `_id -> id`
- `tenant_id -> tenant_id`
- `_guid -> guid`
- `_created_at -> created_at`
- `_updated_at -> updated_at`

### `events`

- `_id -> id`
- `tenant_id -> tenant_id`
- `_guid -> guid`
- `_created_at -> created_at`
- `_updated_at -> updated_at`

### `jobtype`

- `_id -> id`
- `tenant_id -> tenant_id`
- `_guid -> guid`
- `_created_at -> created_at`
- `_updated_at -> updated_at`

### `mails`

- `_id -> id`
- `tenant_id -> tenant_id`
- `_guid -> guid`
- `_created_at -> created_at`
- `_updated_at -> updated_at`

### `projects`

- `_id -> id`
- `tenant_id -> tenant_id`
- `_guid -> guid`
- `_created_at -> created_at`
- `_updated_at -> updated_at`

### `state`

- `_id -> id`
- `tenant_id -> NULL::bigint`
- `_guid -> NULL::uuid`
- `_created_at -> NULL::timestamptz`
- `_updated_at -> NULL::timestamptz`

### `timezone`

- `_id -> id`
- `tenant_id -> NULL::bigint`
- `_guid -> NULL::uuid`
- `_created_at -> NULL::timestamptz`
- `_updated_at -> NULL::timestamptz`

### `users`

- `_id -> id`
- `tenant_id -> tenant_id`
- `_guid -> guid`
- `_created_at -> created_at`
- `_updated_at -> updated_at`

Special rule:

- `users.password` stays in the physical table
- it must not be added to `dataSchema.fields`
- it must not be added to `uiSchema`
- `users` also seeds three initial views:
  - `Users` as default
  - `Contacts` as secondary `contacts`
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
ON CONFLICT (model_id) DO NOTHING;
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
ON CONFLICT (model_id, view_id) DO NOTHING;
```

Why the active migration uses `DO NOTHING`:

- new tenant DBs can receive the same rows from the regenerated tenant bundle before incremental tenant migrations run
- existing tenant DBs may already contain local Form Builder authoring edits
- the seed must be additive and must not overwrite tenant-local metadata silently

## Migration Preconditions

Before turning the draft into a live SQL migration, we need:

1. exact field map for each table
2. exact default grid columns for each model
3. exact lookup relationships between the static models
4. explicit exclusion list for sensitive or internal columns

## Immediate Decisions Already Locked

These points are already fixed and do not need reopening:

1. static models use `sourceType = external`
2. source tables are reused
3. `vw_*` and `vg_*` remain managed by Form Builder
4. `projectsaccess` stays out of the migration
5. `users.password` is excluded from the schema

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
