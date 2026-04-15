# Runtime Naming Contract v1.1

Status: accepted
Date: 2026-04-14

## Purpose

This document defines the accepted v1.1 runtime naming contract for Form Builder:

- physical runtime table names
- canonical data-view names
- grid-view names
- runtime alias generation
- where runtime metadata must be returned in `dataSchema` and `uiSchema`
- the cutover rule for adopting the new structure

This contract replaces the older runtime naming direction that derived SQL object names directly from long mutable authoring keys such as raw subform `tableKey` values.

## Core Rule

Form Builder now treats logical authoring keys and physical runtime names as different layers.

Logical authoring keys remain:

- `model.id`
- `model.key`
- `subform.tableKey`
- `view.key`

Physical runtime names are generated separately through immutable runtime aliases:

- `model.rtAlias`
- `scope.rtAlias`
- `view.rtAlias`

## Cutover Rule

v1.1 is a cutover, not a dual-compatibility contract.

Accepted migration position:

1. On `Save`, if runtime metadata is missing in `dataSchema` or `uiSchema`, backend generates it and returns it.
2. After runtime metadata exists, backend treats it as canonical.
3. Old runtime tables/views are not supported by the new naming contract.
4. Legacy runtime objects may be removed outside backend compatibility logic.

This means v1.1 does not preserve old runtime naming as a live compatibility layer.

## Prefix Set

Accepted runtime prefixes:

- physical tables: `ps_`
- canonical data views: `vw_`
- grid views: `vg_`

Rejected in v1.1:

- `vw_ps_`
- mixing multiple runtime prefixes for the same object class

Reason:

- physical tables stay visually separate through `ps_`
- canonical read surfaces become shorter and more readable through `vw_`
- grid projections become explicit through `vg_`

## Runtime Alias Budgets

Accepted maximum alias budgets:

- `model.rtAlias <= 29`
- `scope.rtAlias <= 10`
- `view.rtAlias <= 12`

Accepted generation rules:

- lowercase ASCII only
- `snake_case`
- deterministic shortening
- hash suffix on overflow or collision
- immutable after first generation

## Runtime Alias Generation

### Model

Preferred rule:

- keep a readable semantic stem if it fits
- shorten and append a hash suffix if too long

Examples:

- `test_inspection` -> `test_inspection`
- `test_inspection_for_auto_company` -> `test_inspection_for_auto_82af`

### Subform Scope

Preferred rule:

- always generate a short local scope alias
- do not reuse raw long `tableKey` values in physical names

Pattern:

- `sf_<hash-or-short-tail>`

Examples:

- `subform-1776131757551-y3h9k3` -> `sf_31de9a`

### View

Preferred rule:

- `default` stays `default`
- non-default views use short readable stems plus a hash suffix

Examples:

- `default` -> `default`
- `test-inspection-copy` -> `copy_82af`
- `test-inspection-for-gc` -> `for_gc_31de`

## Physical Runtime Object Names

### Root Table

Pattern:

- `ps_<model.rtAlias>`

Example:

- `ps_test_inspection_for_auto_82af`

### Root Multivalue Table

Pattern:

- `ps_<model.rtAlias>__mv`

Example:

- `ps_test_inspection_for_auto_82af__mv`

### Subform Table

Pattern:

- `ps_<model.rtAlias>__<scope.rtAlias>`

Example:

- `ps_test_inspection_for_auto_82af__sf_31de9a`

### Subform Multivalue Table

Pattern:

- `ps_<model.rtAlias>__<scope.rtAlias>__mv`

Example:

- `ps_test_inspection_for_auto_82af__sf_31de9a__mv`

## Runtime SQL View Names

### Canonical Data View

Root scope:

- `vw_<model.rtAlias>`

Subform scope:

- `vw_<model.rtAlias>__<scope.rtAlias>`

Examples:

- `vw_test_inspection_for_auto_82af`
- `vw_test_inspection_for_auto_82af__sf_31de9a`

### Grid View

Root scope:

- `vg_<model.rtAlias>__<view.rtAlias>`

Subform scope:

- `vg_<model.rtAlias>__<scope.rtAlias>__<view.rtAlias>`

Examples:

- `vg_test_inspection_for_auto_82af__default`
- `vg_test_inspection_for_auto_82af__copy_82af`
- `vg_test_inspection_for_auto_82af__sf_31de9a__default`

## Base-Table Column Naming In v1.1

v1.1 does not introduce a breaking column-prefix change.

Accepted rules:

- scalar fields: `<storageKey>`
- single lookup foreign keys: `<storageKey>_id`
- child parent foreign key: `_parent_id`

System columns remain:

- `_id`
- `tenant_id`
- `_guid`
- `_created_at`
- `_updated_at`

Examples:

- `first_name`
- `last_name`
- `reported_by_id`
- `reported_date`
- `status`
- `test_inspection_for_auto_82af_id`

## Runtime Metadata In `dataSchema`

Runtime metadata must be present on:

- `dataSchema.rootScope`
- every entry in `dataSchema.subformScopes`

Accepted shape:

```json
{
  "schemaScopeId": "root",
  "runtime": {
    "rtAlias": "test_inspection_for_auto_82af",
    "tableName": "ps_test_inspection_for_auto_82af",
    "mvTableName": "ps_test_inspection_for_auto_82af__mv",
    "dataViewName": "vw_test_inspection_for_auto_82af"
  }
}
```

Subform example:

```json
{
  "schemaScopeId": "subform-1776131757551-y3h9k3",
  "tableKey": "subform-1776131757551-y3h9k3",
  "runtime": {
    "rtAlias": "sf_31de9a",
    "tableName": "ps_test_inspection_for_auto_82af__sf_31de9a",
    "mvTableName": "ps_test_inspection_for_auto_82af__sf_31de9a__mv",
    "dataViewName": "vw_test_inspection_for_auto_82af__sf_31de9a"
  }
}
```

Important rule:

- runtime metadata is returned separately
- backend must not overwrite logical `tableKey` with physical runtime names

## Runtime Metadata In `uiSchema`

Runtime metadata must also be present on the current view document:

- `uiSchema.rootScope.runtime`
- every entry in `uiSchema.subformScopes[].runtime`

This runtime block is view-specific.

Accepted root shape:

```json
{
  "schemaScopeId": "root",
  "runtime": {
    "viewRtAlias": "default",
    "dataViewName": "vw_test_inspection_for_auto_82af",
    "gridViewName": "vg_test_inspection_for_auto_82af__default"
  }
}
```

Accepted subform shape:

```json
{
  "schemaScopeId": "subform-1776131757551-y3h9k3",
  "runtime": {
    "viewRtAlias": "default",
    "dataViewName": "vw_test_inspection_for_auto_82af__sf_31de9a",
    "gridViewName": "vg_test_inspection_for_auto_82af__sf_31de9a__default"
  }
}
```

Reason:

- `dataSchema.runtime` answers "what storage/query objects belong to this scope"
- `uiSchema.runtime` answers "what runtime read/grid objects belong to this authored view for this scope"

## Generated-On-Save Rule

During `Save`, backend must:

1. normalize authoring payload
2. check whether `dataSchema.rootScope.runtime` exists
3. check whether every `dataSchema.subformScopes[].runtime` exists
4. check whether `uiSchema.rootScope.runtime` exists
5. check whether every `uiSchema.subformScopes[].runtime` exists
6. create missing runtime metadata
7. return the enriched schemas in the save response
8. run runtime apply using the generated runtime names

After runtime metadata exists:

- future `Save` calls must reuse it
- backend must not regenerate aliases unless the runtime block is genuinely absent

## Secondary Object Naming

Indexes, PKs, FKs, and similar secondary objects should not reuse long relation names.

Accepted rule:

- assign a deterministic short relation tag `rtag`

Patterns:

- `pk_<rtag>`
- `ux_<rtag>__guid`
- `ix_<rtag>__tenant`
- `ix_<rtag>__parent`
- `fk_<rtag>__parent`

Examples:

- `pk_a13f20`
- `ux_a13f20__guid`
- `ix_a13f20__tenant`
- `fk_a13f20__parent`

## Explicit Non-Goals For v1.1

v1.1 does not introduce:

- `c_<field_rt>` business-column prefixes
- `_parent_id`
- a separate `api_name` layer
- compatibility support for old runtime naming
- automatic migration or rename of old runtime objects

These may be considered later as part of a larger v1.2 or v2 contract.

## Worked Example

Model:

- logical id: `test-inspection-for-auto-company`
- `model.rtAlias = test_inspection_for_auto_82af`

Subform:

- logical `tableKey = subform-1776131757551-y3h9k3`
- `scope.rtAlias = sf_31de9a`

Views:

- default -> `view.rtAlias = default`
- copy -> `view.rtAlias = copy_82af`

Runtime objects:

- `ps_test_inspection_for_auto_82af`
- `ps_test_inspection_for_auto_82af__mv`
- `ps_test_inspection_for_auto_82af__sf_31de9a`
- `ps_test_inspection_for_auto_82af__sf_31de9a__mv`
- `vw_test_inspection_for_auto_82af`
- `vw_test_inspection_for_auto_82af__sf_31de9a`
- `vg_test_inspection_for_auto_82af__default`
- `vg_test_inspection_for_auto_82af__copy_82af`
- `vg_test_inspection_for_auto_82af__sf_31de9a__default`

## Implementation Order

1. Add runtime metadata blocks to canonical `dataSchema` and `uiSchema`.
2. Add immutable alias generation for model, scope, and view.
3. Introduce one central runtime `NameBuilder`.
4. Generate tables/views/multivalue tables from runtime aliases only.
5. Generate secondary objects from `rtag`.
6. Remove any remaining dependency on old runtime names.
