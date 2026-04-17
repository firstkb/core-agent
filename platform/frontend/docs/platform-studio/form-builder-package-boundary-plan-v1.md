# Form Builder Package Boundary Plan v1

Status: active planning contract

## Goal

Keep `platformstudioformbuilder` usable while Form Builder grows, and avoid mixing authoring, runtime record execution, and post-submit side effects in one backend package.

## Keep in `platformstudioformbuilder`

This package stays the builder/control-plane owner.

- model CRUD
- view CRUD
- authoring load/save
- authoring normalization, validation, compatibility, and compaction
- model/view lock and root/static access policy
- runtime metadata derivation
- runtime apply and generated object orchestration
- export model bundle
- export managed data
- runtime list/read scaffolding that already exists today, until extraction is done

## Move to `platformstudioformruntime`

This package should become the runtime data-plane owner for authored views.

- runtime list query
- runtime record read
- runtime create form
- runtime edit form
- runtime record save
- submit-time validation against authored schema
- runtime query filtering, sorting, paging, and row actions
- runtime repositories for reading and writing authored record data

Canonical runtime routes stay the same:

- `/app/forms/:modelId/views/:viewId`
- `/app/forms/:modelId/views/:viewId/new`
- `/app/forms/:modelId/views/:viewId/view/:docGuid`
- `/app/forms/:modelId/views/:viewId/edit/:docGuid`

`Navigation Builder` should later resolve modules to these runtime view targets, not to Form Builder authoring routes.

## Move to `platformstudioformactions`

This package should own post-submit and side-effect execution.

- after-save hooks
- notifications
- integrations
- workflow triggers
- async handoff/background jobs
- retry and failure reporting for side effects

This package must not own model authoring or runtime record persistence.

## Extraction order

1. Keep `filterDefinitions`, sorting, runtime list query, and runtime read working in the current package while runtime is still young.
2. Extract `runtime list + runtime record read` into `platformstudioformruntime`.
3. Extract `new/edit/save record` into `platformstudioformruntime` before that logic lands in `platformstudioformbuilder`.
4. Extract post-submit side effects into `platformstudioformactions` before adding real notifications/integrations/workflows.

## Current implementation note

Today the repository still keeps runtime list/read code inside `platformstudioformbuilder` for delivery speed.

That is accepted as a transitional state only.

The next large runtime slice should not expand `platformstudioformbuilder` again; it should start the extraction into `platformstudioformruntime`.
