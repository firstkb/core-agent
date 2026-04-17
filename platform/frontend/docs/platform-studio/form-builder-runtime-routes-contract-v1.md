# Form Builder Runtime Routes Contract v1

Status: accepted planning contract
Date: 2026-04-16

## Purpose

This document fixes the route contract for Form Builder runtime screens.

It answers six questions:

1. what the canonical runtime paths are
2. how list, create, read, and edit routes are split
3. how record detail may render as a page or a modal
4. which query params are allowed in v1
5. how Navigation Builder resolves a `form_builder_view` target into a URL
6. how Platform Studio preview enters the same runtime engine without becoming a second target type

## Current conclusion

Accepted direction:

- runtime list, create, read, and edit each have a stable canonical path
- authored Form Builder `view` remains the canonical runtime entrypoint
- external record identity uses `guid` only
- Navigation Builder resolves a `form_builder_view` target to the list route
- record-level routes are runtime-internal navigation, not navigation-module targets
- Platform Studio preview uses a separate route namespace for the same runtime engine

## Canonical route base

Accepted runtime base:

- `/app/forms/:modelId/views/:viewId`

This route resolves one authored Form Builder view.

Important rule:

- `modelId` is the stable Form Builder model identity
- `viewId` is the stable authored view identity
- route resolution must not use `view.key`, title, SQL object names, or temporary UI ids

Accepted Platform Studio preview base:

- `/app/platform-studio/forms/:modelId/views/:viewId`

Important preview rule:

- this preview base is not a second runtime target type
- it exists only for Platform Studio entry context

## Canonical route set

Accepted routes:

- list page:
  - `/app/forms/:modelId/views/:viewId`
- create:
  - `/app/forms/:modelId/views/:viewId/new`
- read record:
  - `/app/forms/:modelId/views/:viewId/view/:docGuid`
- edit record:
  - `/app/forms/:modelId/views/:viewId/edit/:docGuid`

## Record identity rule

Accepted public record identity:

- `docGuid`

Rejected public record identity:

- numeric database `id`
- table-local row number
- runtime `_id`

Reason:

- routes, deep links, and module links must use stable public identity instead of internal database implementation detail

## Route responsibilities

### List page

`/app/forms/:modelId/views/:viewId`

Responsibilities:

- render the universal collection table for the authored view
- use the view-owned list/grid contract
- expose actions such as open, create, edit, and delete according to permissions

The list route is the canonical route that Navigation Builder modules should open.

### Create route

`/app/forms/:modelId/views/:viewId/new`

Responsibilities:

- render the universal form runtime in create mode
- use the authored view plus canonical model schema
- on success, navigate according to the runtime redirect rules

### Read route

`/app/forms/:modelId/views/:viewId/view/:docGuid`

Responsibilities:

- resolve one runtime record by `guid`
- render that record in read/detail mode

This is the canonical read target even if product later chooses modal presentation.

### Edit route

`/app/forms/:modelId/views/:viewId/edit/:docGuid`

Responsibilities:

- resolve one runtime record by `guid`
- render the universal form runtime in edit mode

## Record detail presentation

Accepted separation:

- path identity is canonical
- presentation mode is flexible

That means:

- `/app/forms/:modelId/views/:viewId/view/:docGuid` stays the canonical read target
- the UI may render it as:
  - full page
  - route-driven modal over the list

This preserves:

- deep-link stability
- Navigation Builder target stability
- preview/open-link stability

without forcing the final UI decision yet.

## Accepted query params in v1

v1 keeps the query contract intentionally small.

### Shared query params

Accepted on `new`, `view`, and `edit`:

- `returnTo`
  - optional app-relative path used after cancel, close, or save
  - example:
    - `?returnTo=%2Fapp%2Fforms%2Ftest-inspection%2Fviews%2Fview-default`

### Read-route presentation param

Accepted on `view` only:

- `presentation`
  - allowed values:
    - `page`
    - `modal`

Examples:

- `/app/forms/test-inspection/views/view-default/view/abc-123?presentation=modal`
- `/app/forms/test-inspection/views/view-default/view/abc-123?presentation=page`

Default behavior:

- if absent, presentation defaults to the current product default

### Query params not fixed here

The following are intentionally not frozen by this contract:

- collection-table search/filter/sort params
- pagination params
- per-field create-form prefills
- tab/section focus params

Those should be fixed later only when the real runtime needs them.

## Navigation Builder resolution rule

Future Navigation Builder should store:

```json
{
  "targetType": "form_builder_view",
  "modelId": "test-inspection",
  "viewId": "view-default"
}
```

Accepted resolver rule:

- `targetType = form_builder_view` resolves to the canonical list route for that view

Resolution result:

- `/app/forms/:modelId/views/:viewId`

Why this is accepted:

- a sidebar module normally opens the view as a working surface, not one specific record
- record `view` and `edit` routes are runtime-internal transitions
- this avoids making Navigation Builder responsible for record-specific routing

## Builder preview rule

Form Builder preview actions such as `View data` should resolve to the same runtime engine through the Platform Studio preview route family.

Accepted rule:

- preview entry from Form Builder opens:
  - `/app/platform-studio/forms/:modelId/views/:viewId`

Optional later actions may open:

- create route
- read route
- edit route

but they must still stay attached to the same authored `form_builder_view` target.

## Redirect rules

Minimum accepted redirect direction:

- open from Navigation Builder module -> list route
- open from Form Builder preview -> Platform Studio preview route
- cancel/close from `new`/`view`/`edit`:
  - use `returnTo` if present
  - otherwise fall back to the canonical list route for the same `modelId/viewId`

## Non-goals for this contract

The following are not fixed here:

- final modal UI implementation
- list filtering query schema
- collection-table pagination query schema
- create-form prefill query schema
- privilege matrix
- navigation rail grouping

## Short decision summary

Accepted runtime route contract:

- list:
  - `/app/forms/:modelId/views/:viewId`
- create:
  - `/app/forms/:modelId/views/:viewId/new`
- read:
  - `/app/forms/:modelId/views/:viewId/view/:docGuid`
- edit:
  - `/app/forms/:modelId/views/:viewId/edit/:docGuid`

Accepted v1 query params:

- `returnTo`
- `presentation=page|modal` on read route only

Accepted Navigation Builder behavior:

- `form_builder_view` resolves to:
  - `/app/forms/:modelId/views/:viewId`
- Platform Studio preview resolves separately to:
  - `/app/platform-studio/forms/:modelId/views/:viewId`
