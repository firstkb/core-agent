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
- Empty or missing tenant configs start with only locked Dashboard plus the root
  add affordance. Do not seed mock app menu entries into production builder
  state; example trees belong only in tests/fixtures.
- First backend persistence slice is active in
  `platform/backend/modules/tenant/platformstudionavigationbuilder`; it exposes
  `GET /app/platform-studio/navigation` and
  `PUT /app/platform-studio/navigation`, stores definitions in
  `ps_navigation_config`, enforces duplicate target validation, and uses
  optimistic `expectedVersion` checks.
- Access authoring is active for app menu and utility rail items. Navigation
  Builder writes canonical policy into `ps_navigation_config.definition_json`,
  and backend `Save` synchronizes derived runtime/access tables in the same
  transaction. Runtime sidebar filtering, utility rail visibility, and future
  direct route/API guards still need the derived backend evaluator; they must
  not rely on frontend-only checks or repeated ad hoc JSON parsing.
- Runtime sidebar projection is active through `GET /app/navigation`. It reads
  the saved Navigation Builder definition, excludes inactive app menu entries,
  and projects Form View/App Page targets to tenant runtime routes. Tenant-web
  renders root `Menu title` items as UI Lab-style app-layer section headings
  and suppresses empty, consecutive, or trailing title sections at display time.
- V1 targets: Form View, App Page, External Link, and future App Module pages.
- App Modules can have nested subitems. Single app pages such as Business Tree
  are App Page targets, not product modules.
- `Menu title` is the user-facing root-only text divider. It does not have icons, targets, or
  nested children.
- V1 add choices are `Menu title`, `Menu group`, `Form view`, `App page`, and
  `Link`.
  `App module` remains visible as a disabled future add choice until concrete
  app module runtime routes ship. Target-bearing choices open a centered,
  minimal fixed-type add dialog to pick the target before the element is
  created. The inspector can edit the selected value within that fixed type but
  does not expose a target type switch after creation.
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
  an eye-off badge, and are excluded from saved runtime sidebar projection.
  Menu titles do not expose
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
  Platform Studio, Task Manager, Favorites, and Help Center. Rail access uses
  the same authoring model as app menu access but remains one-level.
- V1 editable Access strategy exposes `Inherit from parent`, `Selected
  recipients only`, and `Everyone except selected recipients`. `All
  authenticated users` remains a persisted default/compatibility mode but is
  not exposed as an editable child-item strategy because children cannot expand
  a restricted parent. Recipient pickers use centered table dialogs with
  server-side search and pagination for large users/company/jobtype lists.
  Access source entities are current `users`, `company`, `companytype`, and
  `jobtype`; matching is `users OR ((companies OR company types) AND job types)`.
  Effective child access is bounded by parent access; children can narrow but
  cannot expand beyond parent. External Link access controls only sidebar
  visibility, not the external resource.
- V1 navigation icons are configurable for every editable app menu item except
  `Menu title`. The icon picker starts with `None` so any item can render
  without an icon, and the dictionary includes inspection-oriented choices such
  as checklist, hazard, camera, safety, work, maintenance, PPE, fire, fleet,
  equipment, location, people, documents, forms, reports, routes, activity,
  completed, and settings. Status badges can still show hidden/restricted/broken
  state.
- Future App Module targets are represented as containers with possible nested
  subitems, but they remain inactive/preview-only until real app module runtime
  routes ship.
- Runtime shell integration: when Navigation Builder entries drive the real
  sidebar, opening a configured App Page or Form View updates the tenant top bar
  title and breadcrumb from the Navigation Builder path and target metadata.
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
  do not let users select it for editing, and do not show the lock badge for
  Dashboard. Reserve lock badges for access/restricted items.
- Use editable draft plus explicit Save. Do not make every edit realtime-live in
  tenant navigation.
