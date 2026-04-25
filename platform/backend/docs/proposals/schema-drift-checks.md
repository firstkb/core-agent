# Backend Schema Drift Check Strategy

Status: future proposal
Last audited: 2026-04-25
Canonical scope: future backend schema drift verification

This is proposal scope.
Do not treat it as active runtime behavior until implementation starts.

Read with:

- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/contracts/migrations.md`

## Goal

Add a `db check` capability for master and tenant databases without introducing a second schema source of truth.

## Accepted model

- active source of truth remains:
  - `migrations/postgres/master`
  - `bundle/tenant_schema_full.sql`
  - `migrations/postgres/tenant`
  - `migrations/postgres/archive`
- `db check` is a verification layer, not a schema-authoring layer
- do not reintroduce XML-per-table files as a second canonical contract

## Why this is needed

- detect schema drift in long-lived databases
- verify that local, sandbox, demo, and future production databases match the approved baseline
- catch missing columns, wrong defaults, wrong indexes, missing policies, and partition gaps
- support root/admin diagnostics later in the control-plane UI

## What `db check` should compare

For master:

- tables
- columns
- data types
- nullability
- defaults
- primary keys and unique keys
- indexes
- views
- partitioning metadata

For tenant:

- tables
- columns
- data types
- nullability
- defaults
- primary keys and unique keys
- indexes
- triggers
- row-level security
- policies
- partitioning metadata

## What must not become a second source of truth

Do not maintain:

- XML table definitions
- hand-authored per-table mirror files
- separate schema descriptors that drift from SQL migrations

If a manifest is needed for the checker, generate it from the accepted SQL baseline rather than maintaining it manually.

## Recommended rollout

1. Keep migrations and bundle as the only authoring surface.
2. Add a read-only schema introspection command for master and tenant.
3. Compare live database metadata against the approved baseline model.
4. Produce:
   - human-readable report
   - machine-readable JSON report
5. Later expose the report in admin diagnostics.
6. Only after the report is trusted, consider root-only maintenance actions from admin UI.

## Suggested output classes

- `ok`
- `warning`
- `drift`
- `unsupported`

## First useful checks

- missing table
- missing column
- wrong column type
- wrong nullability
- wrong default
- missing index
- missing RLS or policy
- partitioned table missing future partitions
- rows present in `events_default`

## Admin UI guidance

Later admin UI may show:

- current master/tenant schema health
- partition coverage window
- drift summary
- explicit root-only maintenance actions

But UI should call backend maintenance/report endpoints. The browser must not own DDL logic directly.

## Future note

Partition maintenance and schema drift check are related but separate:

- partition maintenance creates future partitions
- schema drift check verifies that the database still matches the approved runtime contract
