# Form Builder Runtime Storage Review Brief

Status: active
Date: 2026-04-14

## Purpose

This brief captures the current Form Builder runtime contract as implemented for PostgreSQL so it can be reviewed by a larger model for naming, portability, safety, and schema-generation quality.

It covers:

- metadata/control-plane tables
- generated runtime tables
- multivalue bridge tables
- canonical data views
- grid views
- column naming
- lookup-derived outputs
- tenant rules
- index rules
- known risks and open design concerns

## Lifecycle Contract

`Save` now means:

1. persist authoring state
   - `dataSchema`
   - `layoutBlueprint`
   - `uiSchema`
2. run additive runtime apply

Runtime apply currently:

- creates missing managed tables
- adds missing columns
- creates or recreates canonical data views
- creates or recreates grid views
- creates multivalue bridge tables when needed

Runtime apply must not:

- drop tables
- drop columns
- drop SQL views
- perform destructive renames or scope moves

If runtime apply fails after authoring save succeeds:

- authoring state remains saved
- runtime apply is reported as failed

## Control-Plane Tables

Metadata lives in:

- `ps_model`
- `ps_view`

These are not business-data tables.

## Runtime Storage Objects

### Root Scope Table

Pattern:

- `ps_<model_storage_key>`

Example:

- `ps_test_inspection`

### Subform Scope Table

Pattern:

- `ps_<model_storage_key>__<subform_table_key>`

Example:

- `ps_test_inspection__subform-1776131757551-y3h9k3`

Current note:

- runtime names currently use raw `subform.tableKey`
- this is readable for short keys but becomes problematic when keys are UUID-like or timestamp-like

### Multivalue Bridge Table

Pattern:

- `ps_<scope_storage_key>__mv`

Examples:

- `ps_test_inspection__mv`
- `ps_test_inspection__subform-1776131757551-y3h9k3__mv`

Used for:

- `multi_select`
- `tags`
- `db_lookup` with `selectionMode = multiple`

## Runtime SQL Views

### Canonical Data View

Pattern:

- `vw_ps_<scope_storage_key>`

Examples:

- `vw_ps_test_inspection`
- `vw_ps_test_inspection__subform-1776131757551-y3h9k3`

Purpose:

- stable query surface per storage scope
- flatten lookup-derived display columns
- expose helper outputs used by grid/read surfaces

### Grid View

Pattern:

- `vw_ps_<scope_storage_key>__<view_key>_grid`

Examples:

- `vw_ps_test_inspection__default_grid`
- `vw_ps_test_inspection__test_inspection_copy_grid`

Grid view rule:

- always include system columns
- child-scope grids also include the parent foreign key
- then include only the visible authored bindings from `viewSettings.list.columns`
- if the grid has no authored columns, still create the grid view but keep only system columns plus the parent foreign key for child scopes

This means grid views are no longer allowed to be full `SELECT *` clones of the canonical data view.

## System Columns

Each managed root/subform table contains:

- `_id`
- `tenant_id`
- `_guid`
- `_created_at`
- `_updated_at`

Child tables also contain:

- `<root_storage_key>_id`

The canonical data view and the grid view both surface `tenant_id`.

## Field-To-Column Rules

### Root/Subform Base Table Columns

Scalar kinds:

- `short_text` -> `<storageKey>` `text`
- `long_text` -> `<storageKey>` `text`
- `rich_text` -> `<storageKey>` `text`
- `single_select` -> `<storageKey>` `text`
- `integer` -> `<storageKey>` `bigint`
- `decimal` -> `<storageKey>` `numeric`
- `currency` -> `<storageKey>` `numeric`
- `boolean` -> `<storageKey>` `boolean`
- `date` -> `<storageKey>` `date`
- `date_time` -> `<storageKey>` `timestamptz`

Lookup kinds:

- `db_lookup` single -> `<storageKey>_id` `bigint`
- `db_lookup_value` -> `<storageKey>` `text`

Multivalue kinds:

- `db_lookup` multiple -> no scalar base-table column; values live in bridge table
- `multi_select` -> no scalar base-table column; values live in bridge table
- `tags` -> no scalar base-table column; values live in bridge table

Non-storage/UI-only nodes:

- `section`
- `subform` container node
- `view_only_field`

These do not create base-table columns.

## Multivalue Bridge Table Shape

Current columns:

- `_id`
- `tenant_id`
- `<scope_storage_key>_id`
- `field_key`
- `value_kind`
- `value_key`
- `value_label`
- `lookup_target_id`
- `sort_order`

Current interpretation:

- one bridge table per scope, not one bridge table per field
- repeated values are partitioned by `field_key`

## Lookup-Derived Outputs

Derived outputs live in the canonical data view and can be selected into grid views.

### Contact Lookup

Base FK column:

- `<storageKey>_id`

Derived outputs:

- `<storageKey>__label`
- `<storageKey>__company_name`
- `<storageKey>__company_id`
- `<storageKey>__title`
- `<storageKey>__phone`

Join targets:

- `users`
- `company`

Both are tenant-scoped joins.

### Company Lookup

Base FK column:

- `<storageKey>_id`

Derived outputs:

- `<storageKey>__label`
- `<storageKey>__type`
- `<storageKey>__main_company_name`
- `<storageKey>__state`

Join targets:

- `company`
- `companytype`
- optional main company self-join
- `state`

`state` is treated as a shared dictionary and is not tenant-scoped.

### Project Lookup

Base FK column:

- `<storageKey>_id`

Derived outputs:

- `<storageKey>__label`
- `<storageKey>__num`
- `<storageKey>__name`
- `<storageKey>__company_name`

Join targets:

- `projects`
- `company`

Tenant-scoped where applicable.

### Generic Managed-Model Lookup

Base FK column:

- `<storageKey>_id`

Derived outputs:

- `<storageKey>__label`

Join target:

- canonical data view of the referenced model
- pattern: `vw_ps_<source_model_storage_key>`

### DB Lookup Multiple

Base-table column:

- none in the main scope table

Derived outputs in canonical data/grid views:

- `<storageKey>__labels`
- `<storageKey>__count`

Backed by:

- the scope multivalue bridge table

### Multi Select / Tags

Current storage:

- bridge table only

Current derived output state:

- bridge-table storage exists
- generalized read-model outputs beyond lookup-multiple are still a follow-up concern

## Grid Binding Rules

`viewSettings.list.columns` is the source of truth for grid projections.

Supported grid binding sources:

- field binding
- lookup output binding
- explicit backend column name binding

Current backend resolution order:

1. explicit `columnName`
2. lookup output binding
3. field binding default

Default field binding behavior:

- regular scalar field -> base column
- single lookup -> `__label` if available, otherwise first derived output, otherwise raw FK
- multivalue lookup -> `__labels` if available

If a column is authored but `visible = false`:

- it is not projected into the grid SQL view

## Tenant Rules

Managed Form Builder runtime tables include `tenant_id`.

Tenant-aware joins currently apply to:

- `users`
- `company`
- `projects`
- managed-model data views
- multivalue bridge subqueries

Reference dictionary exception:

- `state` is shared and does not carry `tenant_id`

Current `jobtype` note:

- `jobtype` now exists in tenant DBs and carries `tenant_id`
- current bootstrap seed writes `tenant_id = 0` because migration seeding runs outside tenant request context
- the runtime still uses `users_title` text directly, not a `jobtype_id` foreign key

## Index Rules

### Managed Scope Tables

Current runtime index policy:

- `(tenant_id)`
- unique `(tenant_id, _guid)`
- `(tenant_id, <parent_fk>)` for child scopes
- `(tenant_id, <lookup_fk>)` for single-value lookup fields

### Multivalue Bridge Table

Current runtime index policy:

- `(tenant_id)`
- `(tenant_id, <owner_fk>, field_key)`
- `(tenant_id, field_key, lookup_target_id)`

## Current PostgreSQL Risks

### Identifier Length

PostgreSQL identifiers are limited to 63 bytes.

Current risk:

- subform runtime names use raw `subform.tableKey`
- grid view names append both scope storage key and `view.key`
- long subform keys plus long view keys exceed PostgreSQL's identifier limit
- PostgreSQL truncates these names silently at creation time

Current mitigation now implemented for runtime SQL views:

- canonical data views and grid views now pass through a deterministic identifier shortener
- if the raw SQL view name would exceed 63 bytes, the runtime trims it and appends a stable hash suffix
- this mitigation prevents the grid-view collision/truncation issue observed with long subform keys and long copied view keys

Remaining open risk:

- physical table names still use the readable raw scope-storage pattern
- if future root storage keys or subform table keys become longer, table naming may need the same deterministic short-name strategy

Observed consequence:

- generated grid view names may be cut off and become difficult to reason about
- there is collision risk if two long names share the same leading prefix

### Current Naming Debt

The current naming contract is more robust for SQL views now, but physical object naming is still not fully solved for:

- UUID-like subform keys
- timestamp-like generated keys
- long copied view keys
- deep child-scope table names

### Recommended Review Questions

The larger model should explicitly evaluate:

1. should runtime scope objects keep readable names plus deterministic hash suffixes
2. should subforms use a short stable runtime key distinct from the full authoring `tableKey`
3. should grid views always use a hashed suffix to avoid truncation collisions
4. should all indexes/constraints/views share one central name-shortening utility

## Current Example For The Reported User Case

For model storage key `test_inspection`:

- root table: `ps_test_inspection`
- root data view: `vw_ps_test_inspection`
- default grid view: `vw_ps_test_inspection__default_grid`
- copied-view grid example: `vw_ps_test_inspection__test_inspection_copy_grid`
- root bridge table: `ps_test_inspection__mv`

For subform table key `subform-1776131757551-y3h9k3`:

- child table: `ps_test_inspection__subform-1776131757551-y3h9k3`
- child data view: `vw_ps_test_inspection__subform-1776131757551-y3h9k3`
- child bridge table: `ps_test_inspection__subform-1776131757551-y3h9k3__mv`
- child grid view: `vw_ps_test_inspection__subform-1776131757551-y3h9k3__default_grid`

This exact style is what currently drives the PostgreSQL 63-byte risk.

## Recommended Review Focus For A Larger LLM

Ask the larger model to review:

- naming safety under PostgreSQL identifier limits
- table/view/index collision resistance
- whether one bridge table per scope is the right multivalue strategy
- whether lookup-derived output naming is sufficiently future-proof
- whether grid-view generation should support richer output binding types
- how to normalize runtime names without losing operator readability
- whether data view and grid view separation is clean enough for future reporting/query features
