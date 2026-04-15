# Static Models Execution Plan v1

Status: accepted
Date: 2026-04-15

## Purpose

This document fixes the active execution order for Static Models Integration v1 and the immediate Form Builder follow-up work that must not be lost between iterations.

It is the working plan for:

- static model schema freeze
- missing field contract work
- static model migration design
- static model access restrictions
- the first implementation order after the canonical tenant bundle reset

## Locked Direction

Accepted direction:

- static models keep one canonical SQL data view per scope
- static models may have multiple authored Form Builder views
- each authored view may own its own grid SQL projection `vg_*`
- Form Builder must not create one separate SQL data view per authored form view
- schema freeze must happen before static model seed migrations

## SQL View Rule

Accepted runtime rule:

- one canonical `vw_*` per model root scope
- one canonical `vw_*` per subform scope when subforms exist
- one `vg_*` per authored view and scope combination

Why this stays accepted:

- canonical `vw_*` is the stable read contract for the model
- `vg_*` is the authored projection for one concrete view
- this avoids creating multiple nearly identical SQL data views with only presentation-level differences

Important label rule:

- SQL view columns must be generated from stable canonical field/runtime aliases, not from UI labels
- title changes in the default view may update canonical `dataSchema.label`
- default-view label-only rename must not create structure drift for other views
- title changes in non-default views stay local in `uiSchema`
- local title changes do not affect the canonical SQL surface

## Priority Order

### P0. Freeze the contracts before more migrations

#### 1. Finalize `Data Schema` and `UI Schema` for static models

Before any new seed migration is written, confirm the final payload contract for static models:

- required runtime blocks
- required root and scope metadata
- exact field ownership split between `dataSchema` and `uiSchema`
- explicit exclusion of sensitive fields such as `users.password`
- exact authored-view count per model

This contract is now fixed in:

- `platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md`

#### 2. Lock the SQL view strategy

The following is accepted and should be treated as frozen unless a new contract explicitly replaces it:

- one canonical `vw_*` per scope
- per-authored-view `vg_*`
- no per-authored-view canonical `vw_*`

#### 3. Add the missing field contract for free-text suggestions

Form Builder still needs one field type for static models and ordinary managed models:

- ajax search
- suggestion list built from distinct values of the same text source
- ability to select an existing suggestion
- ability to enter a new custom value
- persisted value remains plain text

Working name for the contract:

- `suggest_text`

Minimum behavior:

- source values come from the same column/domain
- search is tenant-scoped
- results are returned through ajax
- custom values are allowed
- no lookup FK is stored

This contract is now fixed in:

- `platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md`

### P1. Design the static models one by one

#### 4. Start schema design with `users`

Design work starts with `users`, because it is the richest static model and already has legacy UI references.

Locked notes:

- `Contacts` is the default authored view for `users`
- `List of Accounts` is a second authored view for `users`
- `users.password` must not enter `dataSchema`, `uiSchema`, or grid definitions
- `Project Access List` stays a separate custom widget track

#### 5. Continue table-by-table with the remaining static models

After `users`, continue with:

- `company`
- `companytype`
- `jobtype`
- `state`
- `timezone`
- `projects`
- `events`
- `mails`

Note:

- this is the design order, not the physical migration dependency order

#### 6. Use dependency order when writing DB migrations

When the static-model seed migration starts, the physical dependency order must be:

1. `state`
2. `timezone`
3. `companytype`
4. `jobtype`
5. `company`
6. `users`
7. `projects`
8. `projectsaccess`
9. `events`
10. `mails`

## P2. Access Restrictions

This requirement is accepted now and implementation is deferred until the admin-panel root-rights path is complete.

Accepted rule:

- only `root` users may see static models in Form Builder
- only `root` users may edit static model views
- only `root` users may edit static model schema

The capability split must be kept explicit:

- `canSeeStaticModels`
- `canEditStaticModelViews`
- `canEditStaticModelSchema`

Current delivery rule:

- fix this in the contract now
- implement it only after auth/admin root rights are available in tenant app

## P3. Required Follow-up Tracks

#### 7. Add a regression and smoke-test pass before mass static-model seeding

Minimum coverage:

- auth flow
- events logging
- Form Builder load/save/runtime metadata roundtrip
- canonical `vw_*` generation
- authored `vg_*` generation
- static lookup rendering

#### 8. Keep the custom widget backlog explicit

Known accepted widget candidate:

- `users.project_access_manager`

This remains outside the first static-model migration.

#### 9. Keep the import module separate from this repository

Legacy import is still a separate application concern.

Rules:

- do not implement the importer in this repository
- finalize static-model contracts first
- let the importer target the frozen canonical tenant schema

## Immediate Execution Sequence

The current execution sequence is:

1. finalize static-model `Data Schema` and `UI Schema`
2. finalize the `suggest_text` field contract
3. design `users` static model fields and authored views
4. design the remaining static models
5. write the static-model seed migration
6. implement root-only static-model access later, after admin/root auth is complete

## Non-Goals For The Current Step

This plan does not yet include:

- implementing the importer
- implementing the `project_access_manager` widget
- changing the canonical SQL view strategy
- introducing per-authored-view canonical `vw_*`
