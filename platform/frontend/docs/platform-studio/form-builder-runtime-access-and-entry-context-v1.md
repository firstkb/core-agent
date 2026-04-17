# Form Builder Runtime Access And Entry Context v1

Status: accepted planning contract
Date: 2026-04-17

## Purpose

This document fixes two related decisions for Form Builder runtime:

1. how access should be attached to authored views
2. how runtime entry from Navigation Builder differs from Platform Studio preview

It exists to keep runtime delivery simple without mixing:

- authoring preview
- runtime navigation
- favorites
- access enforcement

## Current conclusion

Accepted direction:

- there is one runtime target type:
  - `form_builder_view`
- there are two route entry contexts:
  - runtime route for real app navigation
  - Platform Studio route for authoring preview
- backend access policy should branch by route namespace, not by a second target type and not by an extra request header

This is intentionally a two-route, one-target design.

## Runtime target contract

Accepted target contract:

```json
{
  "targetType": "form_builder_view",
  "modelId": "test-inspection",
  "viewId": "view-default"
}
```

Important rule:

- Navigation Builder stores access and bindings against this target
- favorites reference this target
- runtime ACL is attached to this target
- Platform Studio preview does not create a second target type

## Route entry contexts

Accepted real runtime route:

- `/app/forms/:modelId/views/:viewId`

Accepted Platform Studio preview route:

- `/app/platform-studio/forms/:modelId/views/:viewId`

Meaning:

- `/app/forms/...` is the user-facing runtime surface
- `/app/platform-studio/forms/...` is the authoring preview surface

These routes may render the same runtime engine, but they do not represent the same access context.

## Access boundary rule

Accepted rule:

- backend must enforce access according to the route context that received the request

That means:

- requests serving `/app/forms/:modelId/views/:viewId` use runtime/view grants
- requests serving `/app/platform-studio/forms/:modelId/views/:viewId` use Platform Studio access rules

Important implementation rule:

- backend does not need a custom `source` field or second target type to know the context
- the route namespace already defines the context

This keeps the contract simpler and avoids redundant transport state.

## Navigation Builder access role

Navigation Builder remains the place where the owner configures exposure and grants.

Accepted direction:

- when a sidebar node is connected to a Form Builder view, Navigation Builder configures access for that `form_builder_view` target
- runtime access is therefore attached to the target, not to one raw URL string

This means Navigation Builder owns:

- sidebar exposure
- target binding
- grants for the connected runtime view
- rail visibility for app areas

But the runtime backend still remains the enforcement point.

## Runtime actions and authored view actions

Accepted rule:

- runtime grants and authored view actions both apply

Effective runtime behavior is:

- target access grant allows entry to the runtime view
- authored view actions continue to restrict what the user may do inside that view

Examples:

- a user may have access to the view target but still not see `Add` if authored `canAdd = false`
- a user may have runtime read access but not edit access if authored `canEdit = false`

## Favorites rule

Accepted rule:

- favorites use the runtime target only
- favorites resolve to the runtime route only

That means favorites may resolve:

- `form_builder_view` -> `/app/forms/:modelId/views/:viewId`

Rejected:

- storing Platform Studio preview URLs in favorites
- using preview URLs as the canonical target

## Current implementation slice

Implemented direction:

- Form Builder `View data` now moves to the Platform Studio preview route

That means:

- Form Builder preview should open:
  - `/app/platform-studio/forms/:modelId/views/:viewId`
- Navigation Builder and favorites should continue to open:
  - `/app/forms/:modelId/views/:viewId`

Implemented backend implication:

- preview and runtime now use different API namespaces too
- backend can distinguish the access context from the request path alone

Accepted preview API direction:

- runtime API:
  - `/app/forms/:modelId/views/:viewId/*`
- Platform Studio preview API:
  - `/app/platform-studio/forms/:modelId/views/:viewId/runtime/*`

This API split is the preferred way to enforce the two future guards without adding a `source` flag to request payloads.

Remaining follow-up:

- runtime API namespace still needs a dedicated runtime/navigation grants guard
- Platform Studio preview API namespace still needs a dedicated Platform Studio access guard

Important staging rule:

- do not invent temporary runtime grants before Navigation Builder ACL exists
- until Navigation Builder grants are implemented, runtime APIs remain on the current tenant-auth baseline
- route splitting is preparatory infrastructure, not final access enforcement

Accepted optional preparation:

- backend may later add a helper seam such as `authorizeRuntimeViewAccess(...)`
- but until Navigation Builder ACL exists, that seam should remain allow-by-default
- do not ship a second temporary policy that will later be replaced

## Why this is not overcomplicated

This direction is accepted specifically because it keeps complexity low:

- one target type
- one canonical runtime target contract
- two route namespaces for two different product contexts
- no extra source flag in API payloads
- no route guessing after refresh

This is simpler than:

- one route trying to behave as both runtime and preview
- or two different target types for the same authored view

## Short decision summary

Accepted:

- target type:
  - `form_builder_view`
- runtime route:
  - `/app/forms/:modelId/views/:viewId`
- Platform Studio preview route:
  - `/app/platform-studio/forms/:modelId/views/:viewId`
- backend enforcement:
  - route namespace determines access context
- Navigation Builder:
  - stores ACL/binding against the runtime target, not against preview URLs
