# Platform Studio Contract

Status: active compact contract

## Tracked Owner Docs

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/contracts/platform-studio-navigation-builder.md`

## Product Invariants

- Platform Studio is the umbrella product surface.
- Platform Studio is a suite of builder/configuration tools, not a synonym for Form Builder.
- Form Builder is the active backend-backed builder tool.
- Navigation Builder has an active V1 surface plus backend persistence and
  runtime sidebar projection; real ACL enforcement remains planned.
- Action Builder, PDF Builder, and Report Builder are planned but not implementation-active.
- Platform Studio UI stays app-local in `tenant-web`.
- `@platform/platform-studio-core` owns shared non-UI contracts/helpers.
- Builder UI authors business-level model and layout intent, not raw database implementation.

## Tool Ownership Invariants

- Form Builder owns model/view authoring, field/layout structure, authoring save, additive runtime apply, static/external model view management, and runtime view preparation.
- Form Builder field/catalog support owns palette sections, base field types, presets, System Fields, simple rules, grid columns, root view settings, filters, and scope boundaries.
- Navigation Builder owns sidebar/navigation composition, Form View/App Page/
  External Link targets, future App Module targets with nested subitems,
  authored runtime route targets, draft/Save UX, active/inactive runtime sidebar
  exposure, and future rail utility visibility/access enforcement. It uses a
  dedicated backend package `platformstudionavigationbuilder` for saved
  definition persistence, validation, and runtime sidebar projection; do not add this to
  `platformstudioformbuilder`. V1 already exposes a separate RailBar utility
  tab, but access is mock only;
  access/permission assignment is expected to live here unless a later accepted
  decision creates a separate Access Builder.
- A single tenant app page such as Business Tree is not a product module.
  Modules are broader product areas such as future Training or Task Manager.
- Action Builder owns authored events, view-triggered behavior, notifications, conditional field changes, and post-submit side effects.
- PDF Builder owns configured PDF templates and generated document output from authored/runtime data.
- Report Builder owns report definitions and analytical/read-only reporting outputs.
- Future tools must declare their owner boundary before implementation starts.
- Do not implement planned tool concerns as screen-local hacks inside Form Builder just because Form Builder is currently active.

## Identity And Route Invariants

- User-facing Form Builder language is `Model` and `View`.
- Active route params are `modelId` and `viewId`.
- `modelId` resolves by stable model identity.
- `viewId` resolves by stable view id.
- Do not infer view identity from `view.key`, title, or database GUID.
- Legacy `EntityDefinition` and `FieldDefinition` names may remain only as compatibility aliases during migration.

## Three-Schema Contract

- `ps_model.definition_json` owns `dataSchema`.
- `ps_model.definition_json` owns `layoutBlueprint`.
- `ps_view.definition_json` owns `uiSchema`.
- Canonical authoring transport exposes explicit `draft.model.{dataSchema, layoutBlueprint}` and `draft.view.uiSchema`.
- `default` view is the first stable editor for model-owned structure/blueprint.
- Non-default views are `uiSchema`-only authoring surfaces.
- Scope-root field placement uses reserved `layoutBlueprint.fieldPlacements[].containerKey = "__scope_root__"`.
- Unresolved field placement surfaces as explicit `Unplaced fields`.

## Authoring And Runtime Contract

- `Save` is authoring save plus additive runtime apply, not publication.
- Site exposure, sidebar placement, and runtime permission assignment are Navigation Builder concerns.
- Events, notification side effects, and post-submit automation are Action Builder concerns.
- PDF and report generation are separate tool concerns unless an accepted contract says they are shared lower-level capabilities.
- Additive runtime apply may create missing managed tables, add missing columns, and create/recreate SQL views.
- Additive runtime apply must not delete tables, columns, or SQL views.
- If runtime apply fails after authoring save succeeds, saved authoring state remains persisted and UI should surface partial success.
- Runtime apply failures should include tenant/model/view/error context.

## Static/External Models

- Static/external models are root-only.
- Static/external model schema is read-only even for root.
- Root may manage static model views.
- Static/external models do not expose managed export/import/data actions.

## Runtime Routing And Access

- Runtime delivery is per authored `view`, not per model-only viewer.
- Real runtime list route direction is `/app/forms/:modelId/views/:viewId`.
- Platform Studio preview route is `/app/platform-studio/forms/:modelId/views/:viewId`.
- Runtime ACL is attached to typed target `{ targetType: form_builder_view, modelId, viewId }`.
- Until Navigation Builder ACL lands, do not invent temporary runtime grants.
