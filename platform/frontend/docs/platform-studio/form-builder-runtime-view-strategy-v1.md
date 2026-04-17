# Form Builder Runtime View Strategy v1

Status: accepted planning contract
Date: 2026-04-16

## Purpose

This document fixes the runtime delivery strategy for Form Builder so that:

- runtime work is not implemented twice
- Form Builder preview and future tenant navigation share one runtime engine
- view-level authoring stays the source of truth for list and form runtime

It answers four questions:

1. what the canonical runtime entrypoint is
2. whether runtime should be model-level or view-level
3. how future Navigation Builder modules should target Form Builder runtime
4. in what order runtime delivery should be implemented

## Current conclusion

Accepted strategy:

- Form Builder runtime is `per-view`, not `per-model`
- each authored Form Builder `view` is a future runtime screen
- Form Builder should not build a separate model-only data viewer
- Form Builder should not build two different runtime engines for builder preview and future sidebar/navigation

There is one runtime engine and multiple entrypoints into it:

- Form Builder preview shortcut such as `View data`
- future sidebar module entry
- future direct deep link

Important nuance:

- runtime engine is shared
- route entry context is not
- runtime navigation and Platform Studio preview use different route namespaces

## Canonical runtime entrypoint

The canonical runtime entrypoint is:

- one authored Form Builder `view`

That means the stable runtime identity is:

- `modelId`
- `viewId`

not:

- model only
- raw SQL object name
- temporary frontend route state

## Runtime target contract

Future runtime consumers should reference a typed target, not a handwritten URL.

Accepted target contract:

```json
{
  "targetType": "form_builder_view",
  "modelId": "test-inspection",
  "viewId": "view-default"
}
```

This target contract is the one future Navigation Builder modules should store and resolve.

Why this stays accepted:

- it keeps Navigation Builder independent from raw route strings
- it keeps runtime resolution attached to the stable Form Builder identities
- it avoids a later migration from model-level targets to view-level targets

## Canonical runtime route

Accepted route direction:

- one canonical tenant runtime route should resolve one authored view

Recommended route shape:

- `/app/forms/:modelId/views/:viewId`

Accepted Platform Studio preview route:

- `/app/platform-studio/forms/:modelId/views/:viewId`

Recommended child routes:

- list runtime: `/app/forms/:modelId/views/:viewId`
- create record: `/app/forms/:modelId/views/:viewId/new`
- record detail target: `/app/forms/:modelId/views/:viewId/view/:docGuid`
- record edit: `/app/forms/:modelId/views/:viewId/edit/:docGuid`

Important rule:

- Navigation Builder should not persist raw URLs as the source of truth
- route strings are resolved from the typed runtime target
- Platform Studio preview route is not a second target type and not a Navigation Builder target

External record identity rule:

- runtime routes must use record `guid`, not internal numeric `id`
- route params should therefore resolve by `docGuid`

## Record detail presentation

Record detail is intentionally separated into:

- canonical runtime target
- presentation mode

Accepted rule:

- the canonical read target for one record is `/app/forms/:modelId/views/:viewId/view/:docGuid`

Presentation is still flexible:

- full page
- route-driven modal over the list

This means product can decide later whether record detail opens as a page or as a modal without changing:

- the runtime target identity
- Navigation Builder bindings
- preview/open link generation

## Why model-level runtime is rejected

Model-level runtime is rejected for the active direction.

Reasons:

- different authored views already define different list columns
- future views may define different form composition
- future privileges should attach to one view target, not to a whole model by default
- building a model-only viewer first would duplicate later view-runtime work

Therefore the following is rejected:

- one generic model list screen that ignores view settings
- one separate builder-only data viewer plus one later navigation runtime

## Universal list runtime

Accepted runtime rule:

- the runtime list screen is driven by the authored view

Primary list source:

- the authored root-scope grid runtime surface for that view
- operationally this means the runtime list should use the view-owned `vg_*` projection, not a generic model table dump

Column contract:

- visible list columns come from `uiSchema.rootScope.viewSettings.list.columns`
- lookup output columns use the authored field bindings that already exist in the view definition
- if the authored list is empty, current grid-runtime fallback rules stay in force

The list runtime should reuse the shared universal collection table already being proven in admin surfaces instead of inventing a second list implementation for Form Builder.

## Universal form runtime

Accepted runtime rule:

- the runtime form screen is driven by the authored view plus canonical model schema

Runtime form inputs come from:

- `dataSchema`
- `layoutBlueprint`
- `uiSchema`

Responsibilities:

- `dataSchema` defines field semantics and storage/runtime meaning
- `layoutBlueprint` defines model-owned scope topology and canonical placements
- `uiSchema` defines one concrete authored view layout and view-level behavior

The runtime form renderer must support:

- view record
- create record
- edit record

The runtime form renderer must not invent a second parallel screen-definition format outside the existing Form Builder contracts.

## Builder preview contract

Form Builder should expose runtime through a preview shortcut on each authored view.

Accepted direction:

- add `View data` or `Open runtime` on a view
- this action opens the same authored runtime engine through the Platform Studio preview route

Preview is therefore:

- the same runtime engine
- a different route context
- not a second target type
- not a favorite target
- not a Navigation Builder target

## Navigation Builder integration rule

Future Navigation Builder must integrate on top of the same runtime target.

Accepted rule:

- a navigation module points to `targetType = form_builder_view`
- it does not create a second screen definition for the same Form Builder view
- it does not use the Platform Studio preview route as the runtime target

That means future module settings should bind:

- module
- privileges
- rail visibility
- deep-link/open behavior

to the same runtime target identity:

- `modelId`
- `viewId`

## Authoring locks versus runtime access

Important separation rule:

- Form Builder authoring locks are not the future runtime visibility contract

Current meaning:

- `Lock model structure` controls authoring rights on model structure
- `Lock this view` controls authoring rights on one authored view

These locks must not be reused as the long-term rule for:

- sidebar visibility
- module visibility
- runtime read access

Future runtime visibility and access are expected to belong to:

- Navigation Builder module grants
- rail/sidebar exposure rules
- explicit runtime privileges

`root` keeps universal access.

## Delivery order

Accepted implementation order:

1. deliver root-scope per-view runtime list using the shared collection table
2. add the Form Builder preview shortcut that opens the same runtime view target
3. deliver universal record detail/create/edit runtime using `dataSchema + layoutBlueprint + uiSchema`
4. attach future Navigation Builder modules to the same `form_builder_view` target
5. layer explicit privileges and sidebar exposure on top of that target

## Non-goals for this slice

The following are not part of this strategy slice:

- a separate model-only data viewer
- a second runtime schema format
- Navigation Builder implementation itself
- final privilege matrix for runtime modules
- import/export of runtime routes or modules

## Short decision summary

The accepted direction is:

- authored view = canonical runtime entrypoint
- one runtime engine
- Form Builder preview and future sidebar both open the same target
- no separate model-only viewer
- Navigation Builder must point to `form_builder_view`, not to bespoke duplicate screens
