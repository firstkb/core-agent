# Static Lookup Naming Policy v1

Status: accepted
Date: 2026-04-15

## Purpose

This document fixes the naming rule for lookup-backed fields in static models.

Goal:

- keep static-model authoring names readable
- avoid runtime names such as `user_id_id`
- avoid lookup output names such as `user_id__company_id`
- keep physical source-column mapping explicit and deterministic

This is a naming policy for static/external models.
It does not change the existing managed-model runtime rule.

## Problem

For single-value lookup fields, the managed runtime rule derives the physical base-table FK column as:

- `<storageKey>_id`

That is correct when the logical field key is relationship-shaped:

- `company` -> physical FK column `company_id`
- `state` -> physical FK column `state_id`

But it becomes ugly when a static model copies the raw database FK column name directly into `storageKey`:

- `storageKey = user_id` -> derived physical column `user_id_id`
- derived outputs become `user_id__label`, `user_id__company_id`, `user_id__phone`

This is technically functional, but it is not an acceptable long-term authoring contract.

## Accepted Rule

For lookup-backed fields in static models:

- `storageKey` must be the logical relationship name
- `storageKey` must not include the terminal `_id` suffix
- the real source-table FK column must be stored in field runtime metadata as `runtime.sourceColumnName`

That means:

- authoring key is semantic
- source column is physical
- runtime can still map exactly to the real table column

## Canonical Pattern

Use this pattern for static lookup fields:

```json
{
  "id": "user",
  "kind": "db_lookup",
  "label": "User",
  "storageKey": "user",
  "schemaScopeId": "root",
  "status": "persisted",
  "runtime": {
    "sourceColumnName": "user_id",
    "sourceValueKind": "lookup_id"
  }
}
```

Result:

- source table column: `user_id`
- canonical data-view column: `user`
- derived lookup outputs:
  - `user__label`
  - `user__company_id`
  - `user__phone`

## Do Not Use Raw FK Column Names As `storageKey`

Do not do this in static models:

- `user_id`
- `company_id`
- `state_id`
- `job_type_id`
- `company_type_id`
- `owner_user_id`
- `main_company_id`

Those are physical source-column names, not logical field keys.

## Recommended Mapping Rules

### Simple FK Columns

Map these source columns to these static-model field keys:

- `user_id` -> `user`
- `company_id` -> `company`
- `state_id` -> `state`
- `timezone_id` -> `timezone`
- `job_type_id` -> `job_type`
- `company_type_id` -> `company_type`

### Role-Shaped FK Columns

Keep the domain role, drop only the physical FK suffix:

- `owner_user_id` -> `owner_user`
- `main_company_id` -> `main_company`
- `reported_by_id` -> `reported_by`
- `created_by_id` -> `created_by`
- `updated_by_id` -> `updated_by`
- `target_user_id` -> `target_user`

### Preserve Existing Semantic Prefixes

Do not over-shorten relationship names when the prefix is meaningful.

Keep:

- `owner_user`
- `main_company`
- `reported_by`
- `target_record`

Do not collapse them to:

- `owner`
- `main`
- `reported`
- `target`

unless the domain contract explicitly says that is the canonical relationship name.

## Runtime Consequences

With this policy:

- static-model authoring stays readable
- physical source mapping still points to the real DB column
- data-view aliases stay stable and label-independent
- lookup outputs stay compact and deterministic

Examples:

- `storageKey = user` -> base FK column in managed naming is `user_id`
- `storageKey = company` -> lookup output `company__label`
- `storageKey = owner_user` -> lookup output `owner_user__label`

## Managed Model Rule Stays Unchanged

This policy does not change the managed-model runtime convention.

Managed rule remains:

- single lookup logical key `company` -> physical FK column `company_id`

The fix is on static-model schema naming, not on the shared runtime engine.

## External Runtime Mapping Rule

For static/external models:

- `storageKey` remains logical
- `runtime.sourceColumnName` remains physical
- the source table may still expose raw FK columns ending in `_id`

That separation is intentional and must be preserved.

## Examples By Table

### `mails`

Use:

- `user_id` source column -> field `user`

Do not use:

- field `user_id`

Result:

- good: `user`, `user__label`, `user__company_id`
- bad: `user_id`, `user_id_id`, `user_id__company_id`

### `events`

Use:

- `user_id` source column -> field `user`

Keep scalar identifiers as scalar keys:

- `record_id` may remain `record_id` if it is not a lookup field

### `users`

Use:

- `company_id` source column -> field `company`
- `job_type_id` source column -> field `job_type`
- `state_id` source column -> field `state`
- `timezone_id` source column -> field `timezone`

## Delivery Rule For Ongoing Static-Model Work

Apply this policy to:

- `company`
- `users`
- `projects`
- `events`
- `mails`

and to any later static model that exposes lookup-backed foreign keys.

If a phase draft already uses raw FK column names as `storageKey`, correct it before seed migration work continues.

## Companion Docs

- [form-builder-static-models-integration-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md)
- [form-builder-static-models-schema-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md)
- [form-builder-schema-cleanup-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md)
- [form-builder-static-models-atlas-task-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-atlas-task-v1.md)
