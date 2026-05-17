# Platform Studio State

Status: active compact state
Last compacted: 2026-05-17

## Landed

- Platform Studio is the tenant-web suite for configuring forms, navigation/sidebar, runtime exposure/access, actions/events, PDFs, reports, and related future tools.
- Form Builder is the active Platform Studio implementation tool.
- `api-tenant` exposes model list/create/detail, view list/create/detail/copy/delete, and canonical authoring load/save.
- `/authoring` is canonical for authoring state; `/draft` is temporary compatibility alias.
- `Create Model` seeds the first default view and returns selected view for direct workspace redirect.
- Empty brand-new model first view stays empty until user adds layout or fields.
- Backend persists model-owned `dataSchema + layoutBlueprint` and view-owned `uiSchema`.
- Backend/tenant-web support explicit three-schema load/save.
- Backend-owned Form Builder API/storage/runtime apply behavior is compacted in `platform/backend/docs/contracts/platform-studio-form-builder.md`.
- Form Builder field/catalog/rules/view-settings behavior is compacted in `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
- `model_locked`, `view_locked`, and `ps_view.is_active` are dedicated persisted authoring fields.
- Model structure lock toggle is administrative and must not advance `modelStructureVersion`.
- Tenant-web no longer injects mock Form Builder records when backend cache is empty.
- Tenant-web and admin shell use shared top loader patterns driven from request activity.
- Static/external models are root-only and views-only.
- Runtime SQL view shortening with hash suffix exists for long canonical/grid names.
- Managed runtime tables and views expose `tenant_id`.
- Runtime Naming Contract v1.1 is accepted.
- Static `users` and `company` model migrations are documented as seeded with immediate runtime SQL views.
- Runtime view route and preview route split is partially implemented.
- Runtime list applies authored default filters to grid query and search suggestions.
- Runtime list supports saved filters and favorites using Collection Table pattern.
- Navigation Builder backend is active in dedicated package
  `platformstudionavigationbuilder`. It exposes
  `GET/PUT /app/platform-studio/navigation` for authoring and
  `GET /app/navigation` for runtime sidebar projection, stores saved
  definitions in `ps_navigation_config`, validates duplicate targets, excludes
  inactive runtime items, uses optimistic version checks, and now enforces
  direct target checks for Form View APIs, app page APIs, and Platform Studio
  APIs through derived runtime/access rows.

## Accepted / Planned

- Navigation Builder V1 has landed at `/builder/navigation`;
  it owns app menu/sidebar navigation composition, Form View/App Page/External Link
  targets, root-only `Menu title` dividers, future App Module shape with nested
  subitems, separate `App menu`/`Utility rail` editor tabs, `Element`/`Access` inspector
  tabs, fixed add choices with target type locked after creation, `Show in app menu`
  toggle with eye-off inactive badges, Dashboard locked without lock badge, Form
  View labels derived from selected View titles, draft/Save UX, access authoring,
  optional icon picker for every editable non-title app menu item with `None`,
  runtime sidebar projection for active saved app menu entries, UI Lab-style
  runtime `Menu title` headings with empty/consecutive/trailing title
  suppression, rail utility visibility/access enforcement, and direct runtime
  target API enforcement. The original V1 artifact is archived at
  `maestro/artifact/archive/2026-05-06-navigation-builder-v1`. Further
  effective-access UX remains planned unless a
  later decision splits access into a dedicated tool.
- Action Builder is planned but not active; it owns authored events, view-triggered behavior, notifications, conditional field changes, and post-submit side effects.
- PDF Builder is planned but not active; it owns generated PDF/template configuration over authored/runtime data.
- Report Builder is planned but not active; it owns report definitions and analytical/read-only reporting outputs.
- Backend package split plan: `platformstudioformbuilder` remains authoring/control-plane owner; runtime record/list work should move to `platformstudioformruntime`; post-submit side effects should move to `platformstudioformactions`.
- Import model is planned from managed export bundle.
- Import data is planned for managed models.
- No active import route/service exists yet.
- Final export-data product decision remains open: raw table, authored/runtime view, or both.
- Managed multiple lookup fields and non-lookup `multi_select`/`tags` have code-backed multivalue bridge-table support; static/external multivalue writes remain deferred.
- Lookup-heavy filter compiler path remains unfinished for `Contact`, `Project`, `Company`, `Reported By`, and similar presets.
- Per-tenant `jobtype` seed/backfill may be needed if tenant-owned rows are required beyond bootstrap `tenant_id = 0`.

## Risks

- View identity can collapse if implementation falls back to mutable keys.
- Non-default views can accidentally mutate model-owned schema/blueprint.
- Runtime apply partial failure can be hidden if UI only shows generic save failure.
- Temporary `/draft` terminology can leak back into product lifecycle language.
- Planned tool concerns can accidentally be implemented inside Form Builder, creating scope creep and future extraction debt.
- Navigation Builder access is now enforced by the derived evaluator for
  runtime targets, so new targets must not add parallel grants or JSON parsing.
- Platform Studio docs are large and can create context overload without this compact pack.
