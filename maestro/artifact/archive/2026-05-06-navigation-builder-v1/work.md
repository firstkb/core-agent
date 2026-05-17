# Navigation Builder V1

Status: closed / archived
Date: 2026-05-06
Closed: 2026-05-17

Note: `Accepted Scope` records the original 2026-05-06 V1 brief. The final
landed scope is captured in `closeout.md`.

## Owner Intent

Build the first UI/UX version of Navigation Builder inside tenant-web Platform
Studio.

## Accepted Scope

- Navigation Builder is a separate Platform Studio tool, not a Form Builder tab.
- Focus on UI/UX first.
- Access is preview/mock only in V1: show a button/modal or similar future UX,
  but do not claim backend ACL enforcement.
- Use editable draft state plus explicit `Save`; no realtime live tenant
  navigation mutation.
- Target-bearing entries include Form View, App Page, External Link, and a planned App
  Module family with possible nested subitems.
- Dashboard is a locked static preview item but does not display the lock
  status badge; the lock badge is reserved for access/restricted items.
- `Menu title` is the user-facing root-only text divider with no icon.
- Add actions expose fixed creation choices: `Menu title`, `Menu group`,
  `Form view`, `App page`, and `App module`; target-bearing choices use a
  centered fixed-type add dialog before creation, and the created element type
  is not changed later in the inspector.
- Target-bearing add dialogs block duplicate target selection when the target
  already exists in the app menu.
- Inspector tabs are `Element` and `Access`; `Advanced` is removed from V1.
- `Element` is type-aware: label/type/status live at the top, `Opens` appears
  only for target-bearing items, `Channel` appears only where runtime exposure
  applies, and `Warnings` appears only when warnings exist.
- `Element` includes a `Show in app menu` toggle for containers and target
  entries. Inactive items stay editable in the builder tree, show the eye-off
  badge, and are marked hidden from runtime app menu output. Menu titles do not
  expose active, target, channel, or access controls.
- Delete uses the Form Builder field deletion pattern: inspector danger-zone
  action plus centered confirmation dialog. Deleting a container removes child
  items in the same draft action.
- Form View entry labels are derived from the selected View title continuously;
  they are not manually edited or copied once.
- Icons are only shown on container/module navigation nodes, not on titles or
  final entry targets. Menu groups and modules choose icons from a small
  Navigation Builder icon dictionary.
- Future App Module targets are inactive/preview-only containers with possible
  nested subitems until real runtime module routes ship.
- Ordering is drag-and-drop per parent level; dropping an item only reorders
  siblings under the same parent.
- Utility rail items are a separate left-panel tab, not app menu tree entries;
  V1 access remains preview/mock only.
- Form Builder bridge is planned as a follow-up slice/prompt, not part of the
  first implementation patch.
- Runtime sidebar follow-up: once configured App Page/Form View entries are
  rendered from Navigation Builder, the tenant top bar title and breadcrumb must
  resolve from the Navigation Builder path and target metadata.
- Backend persistence first slice is a dedicated tenant service:
  `platformstudionavigationbuilder`, not an extension of
  `platformstudioformbuilder`.

## Non-Scope

- Runtime ACL/grant enforcement.
- Replacing current tenant runtime manifest source.
- Action/PDF/Report Builder behavior.
- Moving Platform Studio UI into shared packages.

## Implementation Surface

- `platform/frontend/apps/tenant-web/src/features/platform-studio/**`
- `platform/backend/modules/tenant/platformstudionavigationbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/*navigation_builder*.go`
- `platform/backend/migrations/postgres/tenant/007_platform_studio_navigation_builder.sql`
- focused tenant-web tests under `platform/frontend/apps/tenant-web/tests/**`
- localized tenant-web copy when needed
- optional Platform Studio docs/memory updates if scope becomes durable

## Evidence Plan

- Focused tenant-web tests for route metadata and Navigation Builder state.
- Frontend typecheck or targeted tests where feasible.
- `scripts/preflight.sh` before closeout.
- Browser visual smoke if a local dev stack can run within the turn.

## Evidence

- Closeout: `closeout.md`.
- Passed: `pnpm -C platform/frontend --filter @platform/tenant-web test -- tests/platform-studio/platform-studio-route-meta.test.ts tests/platform-studio/navigation/navigation-builder-state.test.ts`.
- Passed: `pnpm -C platform/frontend --filter @platform/tenant-web typecheck`.
- Passed: `pnpm -C platform/frontend --filter @platform/tenant-web lint`.
- Passed: `scripts/preflight.sh` lite mode.
- Visual smoke: tenant shell rendered `/builder/navigation` with Navigation
  Builder tabs, tree, and inspector.
- Browser Use cleanup validation: reloaded the open in-app browser tab at
  `https://demo.platform.localhost/builder/navigation`; verified no `Live
  sidebar preview`, no `Publish changes`, no `Revert draft`, no top explanatory
  copy, no relevant console warnings/errors, and exercised label edit plus
  `Save` state (`Save` enabled after edit and disabled after save). The test
  label was restored to the seeded value after validation.
- Browser Use Form Builder alignment validation: verified no internal headers
  on the tree/inspector panels, inspector starts with surface tabs, `Save`
  remains in the top action row under Platform Studio tabs, final entries do
  not show semantic icons, and `Add` is an icon-only row action with corrected
  same-parent menu copy.
- Browser Use drag validation: dragged `Inspections` below `Business Tree` in
  the open in-app browser, confirmed the order changed and `Save` enabled, then
  reloaded the page to restore the seeded order.
- Browser Use fresh-console validation after final reload: no warning/error
  entries after the final build timestamp.
- Browser Use latest validation: reloaded
  `https://demo.platform.localhost/builder/navigation`; verified left
  `Sidebar`/`RailBar` tabs, right inspector tabs, root add row, title text
  divider, no relevant console warnings/errors, nested add menu excludes
  `Title`, root add menu includes `Title`, and selecting `RailBar -> Task
  Manager` switches the inspector to rail utility details.
- Browser Use refinement validation: verified `+` controls only on `Safety` and
  `Training` containers plus the root add row; `Operations`, `Inspections`, and
  old `Add near ...` controls are absent. Verified right inspector tabs no
  longer stretch full width, `Add to Safety` menu has no `Child of Safety`
  footer, dashboard/status icons are visible at a larger size, and `Save` has
  no leading icon gap.
- Browser Use fixed-target validation: verified the right tab background spans
  the inspector width while triggers stay content-sized, inspector tabs had
  moved away from separate `Details`/`Target`, `Target type` was absent, Form
  View kept the selected target, nested add menus offered only `Menu group`,
  `Form View`, `App Page`, and `App Module`, and the root add menu offered
  `Title`, `Menu group`, `Form View`, `App Page`, and `App Module`.
- Browser Use Element cleanup validation: reloaded the open in-app browser tab
  at `https://demo.platform.localhost/builder/navigation`; verified `Advanced`
  and `Route key` are absent, `Element` and `Access` are the only right
  inspector tabs, `Element` has `Identity`, `Target`, `Channel`, and
  `Diagnostics` dividers, `Runtime channel` is inside `Element`, Form View label
  shows the selected View title fallback (`Inspections`) and target summary
  shows `SOR / Inspections`, the unresolved `sor / view-default` label is gone,
  and no new warning/error console entries appeared during the validation.
- Browser Use Active toggle validation: reloaded the open in-app browser tab;
  verified Dashboard no longer shows the lock badge while the restricted Safety
  item still shows the access lock badge, `Element` exposes a single checked
  `Active` switch, toggling it off changes status to `Inactive`, changes copy to
  `Hidden from runtime sidebar`, and shows the eye-off badge on `Inspections`;
  toggling it back restores `Visible` and `Included in runtime sidebar`.
- Browser Use UX language pass validation: reloaded
  `https://demo.platform.localhost/builder/navigation`; verified `App menu` and
  `Utility rail` left tabs, `Saved` status next to `Save`, `Item`/`Opens`/
  `Channel` Element sections, no normal `Diagnostics` section, no runtime route
  path in the normal target summary, no old `Sidebar`/`RailBar` labels, root add
  menu choices `Menu title`, `Menu group`, `Form view`, `App page`, and
  `App module`, `Show in app menu` toggle changing copy to
  `Hidden from app menu` and enabling `1 unsaved change`, and utility rail
  `Access` tab showing `Configure access preview` with preview-only copy. Fresh
  browser warning/error log count after final reload: 0.
- Browser Use UX pass 2 validation: reloaded
  `https://demo.platform.localhost/builder/navigation`; verified `Menu title`
  selection hides `Opens`, `Channel`, and `Show in app menu`; verified Safety
  module hides `Opens` while keeping `Channel` and `Show in app menu`; verified
  `Add item to Safety -> App page` opens a fixed-type add sheet, keeps `Add`
  disabled before target selection, enables it after selecting `Business Tree`,
  creates the selected App page without a broken-target warning, and updates the
  counter to `1 unsaved change`. Reload restored the seeded saved state. Fresh
  browser warning/error log count after final reload: 0.
- Browser Use UX pass 3 validation: verified container icon selection through
  the icon dictionary, centered fixed-type `Add app page` dialog with minimal
  content, duplicate target warning for existing `Business Tree`, disabled
  `Add` while duplicate is selected, Form Builder-style `Delete item`
  confirmation for `Training matrix`, child removal from the draft tree, seeded
  state restoration after reload, and zero fresh warning/error console entries
  after the final reload baseline.
- Fixed unsaved-change counting to compare navigation nodes by stable `id`
  instead of sorted array index, so adding one node reports one draft change.
- Backend first slice: added dedicated
  `platformstudionavigationbuilder` service/repository/handler package,
  tenant schema table `ps_navigation_config`, `GET/PUT
  /app/platform-studio/navigation`, optimistic `expectedVersion` saves,
  duplicate target validation, docs/memory, and regenerated tenant bundle.
- Passed: `go test ./modules/tenant/platformstudionavigationbuilder`.
- Passed: `go test ./cmd/api-tenant/...`.

## Follow-Up Prompt To Capture

Captured in
`maestro/artifact/archive/2026-05-06-navigation-builder-v1/form-builder-bridge-follow-up-prompt.md`.

Rail utility visibility/access follow-up captured in
`maestro/artifact/archive/2026-05-06-navigation-builder-v1/rail-utility-access-follow-up-prompt.md`.
