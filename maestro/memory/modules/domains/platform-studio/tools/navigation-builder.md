# Navigation Builder

Status: active UI-first V1
Last compacted: 2026-05-06

## Expected Ownership

- App menu/sidebar navigation structure.
- Module assembly from authored Form Builder views.
- Runtime exposure of configured application entries.
- Access-facing navigation composition.
- Permission/grant assignment unless a later accepted decision creates a separate Access Builder.

## Current Integration Point

- Form Builder runtime target type is expected to be `{ targetType: form_builder_view, modelId, viewId }`.
- Real runtime list route direction is `/app/forms/:modelId/views/:viewId`.
- Navigation Builder should resolve configured entries to runtime routes, not to Platform Studio preview routes.
- Tenant-web route: `/builder/navigation`.
- V1 is UI-first: tree editor, inspector, access mock sheet, draft state, and
  explicit `Save`.
- First backend persistence slice is active in
  `platform/backend/modules/tenant/platformstudionavigationbuilder`; it exposes
  `GET /app/platform-studio/navigation` and
  `PUT /app/platform-studio/navigation`, stores definitions in
  `ps_navigation_config`, enforces duplicate target validation, and uses
  optimistic `expectedVersion` checks.
- V1 targets: Form View, App Page, External Link, and future App Module pages.
- App Modules can have nested subitems. Single app pages such as Business Tree
  are App Page targets, not product modules.
- `Menu title` is the user-facing root-only text divider. It does not have icons, targets, or
  nested children.
- V1 add choices are `Menu title`, `Menu group`, `Form view`, `App page`, and
  `App module`. Target-bearing choices open a centered, minimal fixed-type add
  dialog to pick the target before the element is created. The inspector can
  edit the selected value within that fixed type but does not expose a target
  type switch after creation.
- V1 blocks duplicate target selection during add when the same Form View, App
  Page, External Link, or App Module target already exists in the app menu.
- V1 inspector tabs are `Element` and `Access`. `Advanced` is not exposed.
  Technical route keys stay out of the V1 inspector, and `Channel` belongs in
  `Element`.
- `Element` is type-aware: label/type/status live at the top, `Opens` appears
  only for target-bearing items, `Channel` appears only where runtime exposure
  applies, and `Warnings` appears only when warnings exist.
- `Element` includes a `Show in app menu` toggle for app menu containers and
  target entries. Inactive app menu items stay visible in the builder tree, show
  an eye-off badge, and are excluded from runtime app menu output once
  Navigation Builder persistence/publication lands. Menu titles do not expose
  active, target, channel, or access controls.
- Delete uses the same UX family as Form Builder field deletion: a danger-zone
  `Delete item` action in the inspector and a centered confirmation dialog.
  Deleting a container removes its child items from the draft navigation.
- Form View entry labels follow the selected View title continuously.
- V1 ordering is drag-and-drop per parent level only; dropping an item affects
  only siblings under the same root/group/module parent.
- V1 add actions live only on container rows as icon-only `+` controls. Root
  additions use the bottom root add row. Titles and final entries do not show
  `+` actions.
- V1 has a separate left-panel `Utility rail` tab for static shell utilities such as
  Platform Studio, Task Manager, Favorites, and Help Center. Rail access is
  preview/mock only until backend enforcement exists.
- V1 navigation icons are container-level only. Titles and final entry targets
  do not display navigation icons, but status badges can show hidden/restricted/
  broken state. Menu groups and modules choose icons from a small Navigation
  Builder icon dictionary.
- Future App Module targets are represented as containers with possible nested
  subitems, but they remain inactive/preview-only until real app module runtime
  routes ship.
- Runtime shell follow-up: when Navigation Builder entries drive the real
  sidebar, opening a configured App Page or Form View must update the tenant top
  bar title and breadcrumb from the Navigation Builder path and target metadata.
  Example: a `Safety > Inspections` Form View should render an app title and
  breadcrumb that match that navigation path, not a technical route label.

## Guardrails

- Do not invent temporary runtime grants before the real Navigation Builder ACL model exists.
- Do not expose non-root runtime entries from frontend-only fabrication.
- Do not put Navigation Builder persistence or validation in
  `platformstudioformbuilder`.
- Keep `/app/platform-studio/forms/...` as preview/authoring context, not a navigation target.
- V1 Access UI is preview/mock only and must not be claimed as backend route/API
  enforcement.
- Dashboard is a locked static preview item; do not let users remove or move it,
  and do not show the lock badge for Dashboard. Reserve lock badges for
  access/restricted items.
- Use editable draft plus explicit Save. Do not make every edit realtime-live in
  tenant navigation.
