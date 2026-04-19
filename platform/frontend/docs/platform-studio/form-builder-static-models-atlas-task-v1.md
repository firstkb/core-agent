# Static Models Atlas Task v1

Status: active
Date: 2026-04-15

## Purpose

This file is the ready-to-run task prompt for Atlas for the Static Models Integration stream.

It exists so the work does not have to be reconstructed from scattered discussion.

Atlas should use this task when the goal is:

- design the exact Form Builder schemas for static models
- assemble the seed migration inputs for static models
- move through the static models in the correct dependency order
- avoid starting with `users` before its lookup/reference tables exist

## Task Prompt

Use the following task as the working prompt for Atlas.

```text
You are implementing Static Models Integration v1 for Form Builder.

Read and follow these source-of-truth docs first:

1. platform/frontend/docs/platform-studio/form-builder-static-models-execution-plan-v1.md
2. platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md
3. platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md
4. platform/frontend/docs/platform-studio/form-builder-static-models-migration-draft-v1.md
5. platform/frontend/docs/platform-studio/form-builder-static-models-users-field-map-draft-v1.md
6. platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md
7. platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md
8. platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md
9. platform/backend/docs/backend-tenant-canonical-field-mapping-v1.md

Goal:

- build the static-model schemas and migration inputs in the correct order
- do not start with users
- start with the simpler reference and lookup tables first so that users can bind to canonical lookups

Mandatory runtime rules:

- one canonical vw_* per model root scope
- one vg_* per authored view
- no per-authored-view canonical vw_*
- static models reuse the real source table but still own managed vw_* and vg_*
- static models are root-scope only in the first slice
- the external runtime patch for explicit source-column metadata is already in place
- global external reference tables must set tenantScoped = false explicitly
- global external reference tables must omit sourceTenantIdColumn/sourceGuidColumn/sourceCreatedAtColumn/sourceUpdatedAtColumn entirely
- tenant-scoped external tables keep canonical sourceTenantIdColumn/sourceGuidColumn/sourceCreatedAtColumn/sourceUpdatedAtColumn defaults

Mandatory authoring rules:

- every static model must have a model and a default view
- only add secondary views where there is a real separate use case
- use canonical snake_case storage keys
- never import sensitive fields such as `users.password`, `users.username`, or `users.ets_admin` into dataSchema or uiSchema
- use suggest_text only where the accepted contract already allows it

Execution order:

Phase 1. Reference tables
1. state
2. timezone
3. companytype
4. jobtype

Phase 2. Lookup-backed business table
5. company

Phase 3. Rich static model after lookups exist
6. users

Phase 4. Remaining tables
7. projects
8. events
9. mails

Do not seed projectsaccess as a normal static model in this slice.
Treat it as relation-manager/widget-backed work, not as an ordinary root model.

Special rule for users:

- users must not be the first table
- users depends on state, timezone, companytype, jobtype, and company
- users must seed three authored views:
  - Users (default)
  - Contacts
  - List of Accounts

Expected deliverables for each table:

1. exact root dataSchema
2. exact default uiSchema
3. exact additional uiSchema views when required
4. runtime blocks:
   - dataSchema.rootScope.runtime
   - uiSchema.rootScope.runtime for each view
5. migration-ready notes for ps_model / ps_view seed rows
6. explicit exclusions and open questions

Scope classification:

- tenantScoped = false:
  - state
  - timezone
- tenantScoped = true:
  - companytype
  - jobtype
  - company
  - users
  - projects
  - events
  - mails

Expected delivery style:

- work table by table
- finish one table cleanly before moving to the next
- keep the result compatible with the accepted three-schema split
- keep SQL names stable and label-independent
- if a field or placement is not evidenced, mark it explicitly instead of guessing

Output order:

1. state
2. timezone
3. companytype
4. jobtype
5. company
6. users
7. projects
8. events
9. mails

When you reach users, use the accepted three-view contract:

- Users = default full baseline
- Contacts = specialized contact view
- List of Accounts = specialized access/admin view
```

## Delivery Constraints

Atlas should keep the following boundaries:

- do not implement importer logic in this repository
- do not implement `project_access_manager` widget in this task
- do not change the accepted `vw_*` / `vg_*` strategy
- do not introduce per-view canonical `vw_*`
- do not revert to legacy prefixed column naming

## Table Order Rationale

The order is locked for a reason.

`users` must not be first because it depends on canonical lookup-backed tables:

- `state`
- `timezone`
- `jobtype`
- `company`

That means Atlas should not begin by trying to finalize `users` schema payloads before the lookup surfaces are already defined.

## Expected View Strategy By Table

Minimum expectation:

- `state` -> default only
- `timezone` -> default only
- `companytype` -> default only
- `jobtype` -> default only
- `company` -> default only unless evidence shows a second real use case
- `users` -> three views:
  - `Users`
  - `Contacts`
  - `List of Accounts`
- `projects` -> default only unless later evidence shows a second real use case
- `events` -> default only
- `mails` -> default only

## Known Special Cases

### `users`

- exclude `password`
- exclude `username`
- exclude `ets_admin`
- keep `ssn`
- include `city` as `suggest_text`
- keep `project_access_manager` as a placeholder/custom widget surface, not as a normal persisted field

### `projectsaccess`

- do not treat it as a normal static root model in this slice
- hold it outside the ordinary static-model seed path

## Companion Docs

- [form-builder-static-models-execution-plan-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-execution-plan-v1.md)
- [form-builder-static-models-schema-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md)
- [form-builder-static-models-migration-draft-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-migration-draft-v1.md)
- [form-builder-static-lookup-naming-policy-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md)
- [form-builder-static-models-users-field-map-draft-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/frontend/docs/platform-studio/form-builder-static-models-users-field-map-draft-v1.md)
- [backend-tenant-canonical-refactor-contract-v1.md](/Volumes/HD/Projects/github/firstkb/core-agent/platform/backend/docs/backend-tenant-canonical-refactor-contract-v1.md)
