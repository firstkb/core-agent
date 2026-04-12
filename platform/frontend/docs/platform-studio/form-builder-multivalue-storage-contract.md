# Form Builder Multivalue Storage Contract

Status: active
Date: 2026-04-09

## Purpose

This document locks the current backend-facing storage direction for Form Builder fields that can hold more than one value.

It exists to align:

- `Multi select`
- `Tags`
- accepted lookup-multiple authoring entries:
  - `DB lookup`
  - `DB lookup multi`
  - `Contacts`
  - `Companies`
  - `Projects`

This document is a focused companion to:

- `form-builder-choice-fields.md`
- `form-builder-ready-made-fields.md`
- `form-builder-relationships.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`

## Locked Principles

- multivalue storage must be report-friendly
- multivalue storage must not rely on comma-separated text as the canonical format
- multivalue storage must not rely on labels alone as durable values
- static options need stable option identity:
  - `optionKey`
  - `optionLabel`
- root and subform scopes must keep multivalue rows inside their own scope boundary

## Scope

This contract applies to:

- `multi_select`
- `tags`
- accepted lookup-backed multiselect authoring

It does not define:

- the exact `ui-kit` component implementation
- final publish-time DDL
- report-builder UX

## Accepted V2 Position

The current approved direction is:

- base table stores only scalar single-value fields
- multivalue fields store repeated selections in one generated multivalue bridge table per scope
- SQL views may expose aggregated readonly outputs for multivalue fields

Rejected as the canonical default:

- comma-separated strings
- JSON text blobs as the only durable storage surface
- label-only storage

## Stable Option Identity

Static option-backed fields must distinguish:

- `optionKey`
  - durable stored value
- `optionLabel`
  - human-facing copy

Implication:

- reports and filters should target durable keys
- UI can still display labels
- renaming a label should not require rewriting every stored row

## Storage Shape

### Generated Multivalue Table

Each storage scope may generate one companion multivalue table when at least one multivalue field exists.

Pattern:

- `ps_<scope_storage_key>__mv`

Examples:

- `ps_site_audit__mv`
- `ps_site_audit__findings__mv`

### Required Columns

Recommended minimum columns:

- `_id`
- `<scope_storage_key>_id`
  - foreign key back to the owning scope row
- `field_key`
  - identifies which multivalue field the row belongs to
- `value_kind`
  - `static_option`
  - `free_text`
  - `lookup_fk`
- `value_key`
  - stable stored value for static options or tags
- `value_label`
  - readable label snapshot when useful
- `lookup_target_id`
  - optional foreign key target for lookup multiselect rows
- `sort_order`

## Field Families

### `multi_select`

Recommended storage:

- `value_kind = static_option`
- `value_key = optionKey`
- `value_label = optionLabel`

### `tags`

Recommended storage:

- `value_kind = free_text`
- `value_key = normalized tag value`
- `value_label = user-facing tag label`

### Lookup Multiselect

Recommended storage:

- `value_kind = lookup_fk`
- `lookup_target_id = selected foreign key`
- `value_key = stable readable key when applicable`
- `value_label = display label snapshot when useful`

Important rule:

- lookup multiselect should follow the same bridge-table family
- it should not invent a separate one-off storage strategy
- the builder should reach this storage path through dedicated multi-value lookup create options
- it should not expose `single | multiple` as a mutable post-create toggle

## SQL View Aggregates

Canonical data views may expose aggregated readonly outputs for multivalue fields.

Recommended examples:

- `<field_key>__labels`
- `<field_key>__keys`
- `<field_key>__count`

These are view-layer outputs, not base-table columns.

## Builder UI / UX Implications

### Choice Fields

- `Multi select` should author stable option keys and labels
- `Tags` should use the multivalue contract, not a one-off text hack

### Lookup Multiselect

- lookup-backed multiselect should reuse the same storage family
- the frontend should treat it as a dedicated authoring entry in the lookup family
- canonical compile metadata may still carry `selectionMode = multiple`

### Filters And Grid

- filters may target aggregated readonly outputs
- grid may show aggregated labels or counts
- raw bridge-table rows are not normal createable fields

## Backend Payload Direction

Each scope payload should be able to expose:

```json
{
  "multiValueStorage": {
    "tableName": "ps_site_audit__mv",
    "storageKey": "site_audit__mv",
    "ownerForeignKey": "site_audit_id"
  }
}
```

## First Slice Recommendation

The smallest reliable first slice is:

1. lock option identity for `Multi select`
2. lock one multivalue bridge-table pattern per scope
3. let SQL data views expose aggregated labels and counts
4. extend the same storage family later to lookup multiselect

## Companion Docs

- `form-builder-choice-fields.md`
- `form-builder-ready-made-fields.md`
- `form-builder-relationships.md`
- `form-builder-storage-and-sql-view-contract.md`
- `form-builder-backend-scope-payload-contract.md`
