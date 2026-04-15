# Form Builder Three-Schema Contract

Status: working
Date: 2026-04-13

## Purpose

This document locks the next stable Form Builder authoring model around three separate persisted schemas:

- `dataSchema`
- `layoutBlueprint`
- `uiSchema`

It exists to solve the current structural gap:

- `subform` scope can already be recovered from the model
- multi-level layout structures such as `Section`, `Tabs`, `Tab item`, `Accordion`, `Accordion item`, `Grid`, `Column`, and `Group` cannot be recovered in a new view because they still live only inside one existing view

This document is the implementation source of truth for the next Form Builder architecture pass across:

- backend persistence
- frontend authoring state
- Add View / Copy View semantics
- debug modal output
- migration from the current two-surface draft shape

## Accepted high-level model

Platform Studio Form Builder should use three persisted schemas with clear ownership:

- `ps_model.definition_json`
  - `dataSchema`
  - `layoutBlueprint`
- `ps_view.definition_json`
  - `uiSchema`

Accepted product rule:

- one model owns one canonical `dataSchema`
- one model owns one canonical `layoutBlueprint`
- each view owns its own `uiSchema`
- the `default` view is the primary editor for the model-owned `layoutBlueprint`
- `Add View` seeds a fresh `uiSchema` from `dataSchema + layoutBlueprint`
- `Copy View` copies an existing `uiSchema` exactly
- authored fields may live directly at a scope root
- missing fields without a valid blueprint placement must go to `Unplaced fields`, never silently to `root`

## Why the current shape is not enough

The current scope-aware draft shape keeps:

- model field intent in the model draft
- scope-local layout and nodes in the view draft

That is sufficient to recover:

- root fields
- subform existence
- some missing-field reconciliation

It is not sufficient to recover:

- required `Section` hierarchy
- `Tabs` with `Tab item`
- `Accordion` with `Accordion item`
- `Grid` and `Column`
- default placement inside nested layout containers

As long as those structures remain view-local only, a newly created view will always be under-specified.

## Canonical ownership split

### `ps_model` owns

- logical model identity
- `dataSchema`
- `layoutBlueprint`
- model lock state
- model structure version
- stable field identity and scope ownership

### `ps_view` owns

- logical view identity
- stable `viewId` used by routes and authoring load/save
- stable `viewKey` used by default-view semantics and backend keyed naming
- `uiSchema`
- view lock state
- view version
- view-local overrides
- `lastAlignedModelStructureVersion`

Important rule:

- `ps_model` defines what every view must be able to understand
- `ps_view` defines how one specific view currently looks
- `viewId` and `viewKey` must not be silently conflated
- the default view may keep `viewKey = default`, but its `viewId` must still be a distinct stable value

## Canonical vocabulary

### `fieldId`

Stable model-owned field identity.

### `schemaScopeId`

Stable model-owned scope identity.

Rules:

- root scope is always `root`
- each subform scope must have a stable `schemaScopeId`
- `schemaScopeId` must not be a view-local node id
- `schemaScopeId` should normally match the logical subform storage key such as `pb_subform`

### `containerKey`

Stable model-owned layout container identity inside `layoutBlueprint`.

Rules:

- every blueprint container must have one stable `containerKey`
- `containerKey` survives view creation
- `containerKey` is how reconcile finds the right structural target in any view

### `scopeRootPlacementKey`

Reserved field-placement target for an authored scope-root field.

Rules:

- the reserved value is `__scope_root__`
- it is valid only inside `layoutBlueprint.<scope>.fieldPlacements[].containerKey`
- it means the field is intentionally placed at the current scope root with no container parent
- it must not be used as a blueprint container `containerKey`

### `nodeId`

View-local UI node identity inside `uiSchema`.

Rules:

- `nodeId` is local to one view
- `nodeId` must not be reused as model structure identity
- `uiSchema` may rebuild node ids while still preserving the same `containerKey`

### `Unplaced fields`

An explicit per-scope UI state bucket for fields that exist in the model but do not currently have a valid placement in the view.

Rules:

- do not silently place these fields into `root`
- show them explicitly in the workspace
- keep `Save` active until the user resolves or persists the reconciliation result

## Accepted container set for `layoutBlueprint`

The first stable `layoutBlueprint` container set is:

- `section`
- `group`
- `grid`
- `column`
- `tabs`
- `tab_item`
- `accordion`
- `accordion_item`
- `subform`

Important rule:

- `accordion` follows the same parent-child model as `tabs`
- `accordion_item` follows the same structural role as `tab_item`
- `subform` in `layoutBlueprint` is a root-scope anchor to a child `schemaScopeId`

Out of scope for the first three-schema rollout:

- content nodes becoming model-owned blueprint nodes by default
- rich-text/content blueprint inheritance
- generalized template composition across multiple views

Those may be added later after the structural layout contract is stable.

## Canonical persisted shape

### `ps_model.definition_json`

```json
{
  "dataSchema": {
    "modelId": "test-inspection2",
    "modelTitle": "Test Inspection2",
    "rootScope": {
      "schemaScopeId": "root",
      "scopeType": "ROOT",
      "fields": []
    },
    "subformScopes": [
      {
        "schemaScopeId": "pb_subform",
        "scopeType": "SUBFORM",
        "tableKey": "pb_subform",
        "subformType": "DEFAULT",
        "displayName": "Info",
        "fields": []
      }
    ]
  },
  "layoutBlueprint": {
    "rootScope": {
      "schemaScopeId": "root",
      "containers": [],
      "fieldPlacements": [],
      "unplacedFieldIds": []
    },
    "subformScopes": [
      {
        "schemaScopeId": "pb_subform",
        "containers": [],
        "fieldPlacements": [],
        "unplacedFieldIds": []
      }
    ]
  }
}
```

### `ps_view.definition_json`

```json
{
  "uiSchema": {
    "rootScope": {
      "schemaScopeId": "root",
      "viewSettings": {},
      "filterDefinitions": {},
      "nodes": [],
      "unplacedFieldIds": []
    },
    "subformScopes": [
      {
        "schemaScopeId": "pb_subform",
        "parentSubformNodeId": "node-subform-1",
        "viewSettings": {},
        "filterDefinitions": {},
        "nodes": [],
        "unplacedFieldIds": []
      }
    ]
  }
}
```

## `dataSchema` contract

`dataSchema` is model-owned.

It answers:

- which fields exist
- which scope each field belongs to
- which subform scopes exist
- which subform type each scope uses

`dataSchema` must own:

- `fieldId`
- `kind`
- `displayName`
- `storageKey`
- `schemaScopeId`
- field persisted/fixed status
- `schemaScopeId = root` or one stable subform scope

`dataSchema` must not own:

- `nodeId`
- per-view field title overrides
- per-view visibility
- per-view order
- nested layout container topology

Accepted rule:

- moving a field between `root` and a subform changes `dataSchema`
- adding or deleting a subform changes `dataSchema`

## `layoutBlueprint` contract

`layoutBlueprint` is model-owned.

It answers:

- which structural containers must exist by default
- how those containers are nested within each scope
- where fields belong by default
- which fields are currently unplaced at the model level

`layoutBlueprint` must own:

- root-scope `subform` anchor containers
- `section`
- `tabs`
- `tab_item`
- `accordion`
- `accordion_item`
- `grid`
- `column`
- `group`
- stable `containerKey`
- parent-child container hierarchy
- default field placement by `fieldId`
- explicit scope-root field placement by reserved `scopeRootPlacementKey`

`layoutBlueprint` must not own:

- view-local `nodeId`
- view-local inspector tab state
- selected node
- local search query
- any ephemeral canvas state

Recommended shape inside each scope:

```json
{
  "schemaScopeId": "pb_subform",
  "containers": [
    {
      "containerKey": "pb_subform.section.info",
      "type": "section",
      "parentContainerKey": null,
      "title": "Info",
      "order": 0,
      "settings": {}
    },
    {
      "containerKey": "pb_subform.section.info.accordion.quality",
      "type": "accordion",
      "parentContainerKey": "pb_subform.section.info",
      "title": "Quality",
      "order": 1,
      "settings": {}
    },
    {
      "containerKey": "pb_subform.section.info.accordion.quality.item.general",
      "type": "accordion_item",
      "parentContainerKey": "pb_subform.section.info.accordion.quality",
      "title": "General",
      "order": 0,
      "settings": {}
    }
  ],
  "fieldPlacements": [
    {
      "fieldId": "summary_code",
      "containerKey": "__scope_root__",
      "order": 0
    },
    {
      "fieldId": "date",
      "containerKey": "pb_subform.section.info.accordion.quality.item.general",
      "order": 0
    }
  ],
  "unplacedFieldIds": []
}
```

Important rule:

- `layoutBlueprint` is the only accepted source of truth for default structural placement
- `fieldPlacements[].containerKey` must point either to an existing blueprint container or to the reserved `__scope_root__` placement key

## `uiSchema` contract

`uiSchema` is view-owned.

It answers:

- how this one specific view currently looks
- which blueprint containers are already materialized in this view
- which local overrides this view carries

`uiSchema` must own:

- `nodeId`
- view-local container nodes
- view-local field nodes
- `viewSettings`
- `filterDefinitions`
- visibility rules
- requirement rules
- per-view field titles
- per-view ordering
- per-view `unplacedFieldIds`

Container nodes in `uiSchema` should carry their matching `containerKey` whenever they materialize a blueprint container.

Important rule:

- `uiSchema` is reconciled against model-owned schemas
- `uiSchema` is not regenerated from scratch on every load

## Default view vs non-default view semantics

### Default view

The `default` view is the primary authoring surface for model-owned structure.

In the first stable three-schema rollout, the default view is the only accepted place that may mutate:

- `dataSchema`
- `layoutBlueprint`

That includes:

- add field
- delete field from model
- create subform
- move a field across scopes
- create or reorder blueprint containers
- define default field placement

When the default view saves:

- `ps_model.definition_json.dataSchema` may change
- `ps_model.definition_json.layoutBlueprint` may change
- `ps_view.definition_json.uiSchema` for the default view may also change

Important rename rule:

- in the `default` view, field-title editing is the accepted editor for the canonical `dataSchema.label`
- label-only rename from the `default` view is a model metadata change, not a structure-drift change
- label-only rename must not advance `modelStructureVersion` or mark other views out of sync
- in non-default views, field-title editing stays view-local and must not rewrite `dataSchema.label`

### Non-default views

Non-default views are view-specific presentation surfaces.

In the first stable three-schema rollout, non-default views may mutate only:

- their own `uiSchema`

That includes:

- local ordering
- local visibility
- local field title overrides
- local container variations

Non-default views must not silently mutate:

- `dataSchema`
- `layoutBlueprint`

Practical frontend rule:

- model-structure actions and blueprint-layout actions should be disabled outside the default view until an explicit cross-view blueprint-edit mode exists

## Add View and Copy View semantics

### `Add View`

`Add View` must create a fresh `uiSchema` from:

- current `dataSchema`
- current `layoutBlueprint`

It must not:

- copy the exact `uiSchema` of another view
- drop model fields into `root` when blueprint placement is known
- ignore blueprint containers such as `Section`, `Tabs`, `Accordion`, `Grid`, or `Group`

Expected behavior:

- if the model has subform scopes, the new view gets matching `subform` anchors
- if the blueprint contains `Section`, `Tabs`, `Accordion`, `Grid`, or `Group`, the new view gets them
- fields land in their blueprint-defined containers or at scope root when the blueprint uses `__scope_root__`
- fields with no valid placement land in `Unplaced fields`

### `Copy View`

`Copy View` must clone the source view `uiSchema` exactly.

It must not:

- rewrite the cloned view from `layoutBlueprint`
- silently normalize away source-view layout variations

## Reconcile algorithm on open

Every workspace load must reconcile:

- `dataSchema`
- `layoutBlueprint`
- `uiSchema`

Accepted reconcile order:

1. resolve the current model and current view
2. ensure all `schemaScopeId` values from `dataSchema` exist in `layoutBlueprint`
3. ensure all `schemaScopeId` values from `dataSchema` exist in `uiSchema`
4. materialize missing root `subform` anchors from `layoutBlueprint`
5. materialize missing blueprint containers by `containerKey`
6. insert missing fields into their blueprint-defined container or explicit scope-root placement
7. if placement cannot be resolved, add those fields to `uiSchema.<scope>.unplacedFieldIds`
8. leave `Save` active if reconcile made changes

Important reconcile rules:

- authored scope-root placement is valid and must not be downgraded into `Unplaced fields`
- never silently append unresolved fields directly to `root`
- do not discard existing view-local overrides
- preserve local `nodeId` values when possible
- `Accordion` and `Accordion item` follow the same materialization logic as `Tabs` and `Tab item`

## Versioning and drift

The existing version model should remain, but with clarified ownership.

### `modelStructureVersion`

Increment when either model-owned schema changes:

- `dataSchema`
- `layoutBlueprint`

That includes:

- add/delete field
- field type change
- field scope change
- add/delete subform scope
- add/delete/reorder blueprint `Section`
- add/delete/reorder blueprint `Tabs`
- add/delete/reorder blueprint `Accordion`
- add/delete/reorder blueprint `Grid`, `Column`, or `Group`
- change default field placement

### `viewVersion`

Increment when only `uiSchema` changes for one view.

### `lastAlignedModelStructureVersion`

Tracks whether a given view has been reconciled and saved against the current model-owned schemas.

## Backend implementation requirements

### Persistence

Backend must persist:

- `ps_model.definition_json.dataSchema`
- `ps_model.definition_json.layoutBlueprint`
- `ps_view.definition_json.uiSchema`

The backend must keep model-owned and view-owned writes separate even when one save operation persists both.

### Authoring load response

`loadBuilderDraft` or canonical `/authoring` load must return:

```json
{
  "draft": {
    "model": {
      "dataSchema": {},
      "layoutBlueprint": {}
    },
    "view": {
      "uiSchema": {}
    }
  }
}
```

The backend may still include summary metadata outside those objects, but the three-schema split must stay explicit.

### Authoring save request

`saveBuilderDraft` or canonical `/authoring` save must accept the same split:

```json
{
  "expectedVersions": {
    "model": 4,
    "view": 9
  },
  "draft": {
    "model": {
      "dataSchema": {},
      "layoutBlueprint": {}
    },
    "view": {
      "uiSchema": {}
    }
  }
}
```

### `Create Model`

Must:

- create the model row
- initialize empty `dataSchema`
- initialize empty `layoutBlueprint`
- create the default view row
- initialize the default view `uiSchema`

### `Create View`

Must:

- read the current model `dataSchema`
- read the current model `layoutBlueprint`
- generate a fresh `uiSchema`
- persist that `uiSchema` to the new `ps_view`

It must not create an empty shell that ignores known blueprint structure.

### `Copy View`

Must:

- clone only the source `uiSchema`
- keep the new view aligned to the current `modelStructureVersion`

### Validation

Backend validation must now include:

- every field has one valid `schemaScopeId`
- every blueprint placement points to an existing `containerKey` or the reserved `__scope_root__` placement key
- every blueprint `subform` anchor points to an existing `schemaScopeId`
- `tab_item` parent is `tabs`
- `accordion_item` parent is `accordion`
- root-only rules remain enforced for root-only concerns

## Frontend implementation requirements

### State model

Frontend authoring state must become explicitly three-surface:

- `currentModel.dataSchema`
- `currentModel.layoutBlueprint`
- `currentView.uiSchema`

The frontend must stop treating the default structural layout as view-local-only state.

### Builder UI rules

The workspace must:

- show and edit model-owned structure from the default view
- show view-local overrides in all views
- render `Unplaced fields` explicitly per scope
- enable `Save` whenever reconcile or user edits changed any of the three schemas

### View-mode restrictions

In the first stable rollout:

- the field palette should be active only in the default view
- model-structure actions should be disabled in non-default views
- blueprint-layout actions should be disabled in non-default views

Non-default views may still:

- reorder existing nodes
- hide or show fields
- change local titles
- carry local layout-only variations

### Debug modal

The debug modal must now expose three schemas, not two:

- `Data Schema`
- `Layout Blueprint`
- `UI Schema`

Minimum requirements:

- one clearly labeled pane or tab per schema
- raw JSON for each schema
- no flattening back into the old two-surface output

Recommended additions:

- version summary:
  - `modelStructureVersion`
  - `viewVersion`
  - `lastAlignedModelStructureVersion`
- current view role:
  - `default blueprint editor`
  - or `view override`
- reconcile diagnostics:
  - missing fields
  - missing containers
  - `unplacedFieldIds`

## Migration and compatibility plan

### Source migration

Existing drafts currently store structure mostly inside view-local scope trees.

Migration must derive:

- `dataSchema` from current model-owned field registry
- `layoutBlueprint` from the current default view layout
- `uiSchema` for each view from its current stored layout

### Backfill rules

When loading existing data that does not yet have a persisted `layoutBlueprint`:

1. use the default view as the primary blueprint source
2. assign stable `schemaScopeId` values
3. assign stable `containerKey` values to blueprint-derived containers
4. bind matching view containers to those `containerKey` values
5. translate legacy field nodes with no container parent into explicit `__scope_root__` placements
6. keep unmatched view-local containers as local `uiSchema` nodes
7. if placement cannot be inferred safely, place the field into `Unplaced fields`

### Compatibility rule

Do not require a destructive database migration before rollout.

Accepted first rollout:

- lazy read compatibility
- derive missing `layoutBlueprint` on load
- persist the new shape on next successful save

## Acceptance checklist

The three-schema rollout is not done until all of these pass:

1. `Create Model` produces:
   - empty `dataSchema`
   - empty `layoutBlueprint`
   - default view `uiSchema`
2. adding fields and layout in the default view persists:
   - `dataSchema`
   - `layoutBlueprint`
   - default view `uiSchema`
3. `Add View` reproduces blueprint structure:
   - `Section`
   - `Tabs`
   - `Tab item`
   - `Accordion`
   - `Accordion item`
   - `Grid`
   - `Column`
   - `Group`
   - `Subform`
4. `Copy View` preserves source layout exactly
5. opening an older view with missing fields reconciles them into blueprint-defined placement
6. explicit scope-root fields round-trip through `layoutBlueprint.fieldPlacements[].containerKey = "__scope_root__"`
7. unresolved fields appear in `Unplaced fields`, not in raw `root`
8. debug modal shows all three schemas
9. hard reload of a direct-link workspace preserves the same three-schema interpretation

## Recommended implementation stages

1. lock this contract and update typed frontend/backend payloads
2. add backend read/write support for `layoutBlueprint`
3. migrate frontend debug modal to three-schema output
4. make the default view the only blueprint editor in the first stable rollout
5. change `Create View` to seed from `dataSchema + layoutBlueprint`
6. add explicit `Unplaced fields` UX
7. remove fallback logic that silently pushes unresolved fields into `root`

## Companion docs

- `form-builder-first-contract.md`
- `form-builder-schema-scope-contract.md`
- `form-builder-backend-scope-payload-contract.md`
- `form-builder-backend-api-contract.md`
- `form-builder-backend-execution-plan.md`
