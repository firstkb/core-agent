# Navigation Builder V1 Closeout

Status: closed / archived
Closed: 2026-05-17

## Outcome

Navigation Builder V1 is closed as the first stable product milestone for
tenant Platform Studio navigation authoring and runtime delivery.

V1 began as a UI-first builder surface, but the completed milestone now includes
the authoring UI, dedicated backend persistence, runtime sidebar projection,
utility rail visibility, access policy persistence, derived evaluator rows,
runtime filtering, direct target guards, and top-bar quick-create integration.

## Landed Scope

- Tenant-web Navigation Builder at `/builder/navigation`.
- Separate `App menu` and `Utility rail` authoring tabs.
- App menu nodes for `Menu title`, `Menu group`, `Form view`, `App page`,
  `External link`, and future `App module` shape.
- Dashboard as locked non-editable baseline without a lock badge.
- Form Builder-aligned Save/draft UX.
- Type-aware `Element` inspector and inline `Access` inspector.
- Fixed-type add flows, duplicate target prevention, delete confirmation, icon
  picker, per-parent drag ordering, and group collapse affordance.
- Dedicated backend package `platformstudionavigationbuilder`.
- Authoring routes `GET/PUT /app/platform-studio/navigation`.
- Runtime route `GET /app/navigation`.
- Tenant persistence in `ps_navigation_config`.
- Derived runtime/access rows in `ps_navigation_runtime_item`,
  `ps_navigation_access_policy`, and `ps_navigation_access_subject`.
- Runtime access evaluator using
  `users OR ((companies OR company types) AND job types)`.
- Parent-bounds-child access narrowing.
- Protected `root_only` access mode and non-root save protection.
- Runtime filtering for app menu and utility rail entries.
- Direct guards for current Form View, App Page, and Platform Studio targets.
- Tenant shell rendering of configured sidebar titles/icons, menu titles,
  filtered utility rail buttons, and configured title/breadcrumb metadata.
- Top-bar quick-create actions derived from accessible Form View targets.

## Deferred Work

- Form Builder bridge: show `Shown in ...`, `Not in navigation`, and
  `Configure in Navigation Builder` from Form Builder contexts.
- Future App Module runtime route integration.
- Additional App Page route attachment to the same derived evaluator.
- Further effective-access UX, such as clearer `Restricted by parent` summary
  and warnings when a child policy is wider than its parent.
- Possible future split between navigation visibility and form operation
  permissions if create/edit/delete needs policy separation from view access.

## Memory Updates

The Navigation Builder durable memory entrypoints were updated during closeout
so future work starts from the landed V1 baseline instead of the earlier
UI-first/mock-access baseline.

## Closeout Checks

- Artifact status updated.
- Closeout file added.
- Artifact moved from `maestro/artifact/active/` to `maestro/artifact/archive/`.
- Product-code checks were not run because this closeout changes only Maestro
  artifact and memory files.
