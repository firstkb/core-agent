# Platform Studio

Status: active compact module pack
Owner surface: tenant Platform Studio product domain, cross-stack FE/BE
Last compacted: 2026-04-25

## Read This When

- touching Platform Studio or Form Builder
- touching Navigation Builder, sidebar composition, or access-facing navigation
- touching Action Builder, authored events, notifications, conditional behavior, or post-submit side effects
- touching PDF Builder, Report Builder, exports, generated documents, or reporting surfaces
- changing model/view identity
- changing `dataSchema`, `layoutBlueprint`, or `uiSchema`
- changing Form Builder authoring load/save
- changing runtime apply, runtime routes, static models, import/export, or filter behavior
- changing `tenant-web` builder UI, `platformstudioformbuilder` backend, or
  `platformstudionavigationbuilder` backend

## Owner Sources

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/contracts/platform-studio-navigation-builder.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`

Historical import context lives in `maestro/memory/durable/legacy-memory-import.md`; the old `platform/docs/ai/**` path has been deleted.

## Fast Facts

- Platform Studio is the tenant-web tool suite for configuring application behavior.
- Form Builder is active.
- Navigation Builder has an active V1 surface plus backend persistence and
  runtime sidebar projection; Action Builder, PDF Builder, and Report Builder are planned,
  not implementation-active.
- Platform Studio UI stays app-local in `tenant-web`.
- Shared layer is `@platform/platform-studio-core`, not a shared UI package.
- Form Builder route params are `modelId` and `viewId`.
- Titles, SQL names, and view-local node ids are not identity.
- Backend-owned Form Builder API, storage, validation, generated-object, and runtime apply truth lives in `platform/backend/docs/contracts/platform-studio-form-builder.md`.
- Backend-owned Navigation Builder API/storage/validation truth lives in
  `platform/backend/docs/contracts/platform-studio-navigation-builder.md`.
- Form Builder field/catalog/rules/view-settings truth lives in `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
- Planned/open Form Builder work lives in `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`.
- Old Form Builder detail/workstream docs are classified in `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`.

## Tool Map

- `Form Builder`: active. Owns models, views, field/layout authoring, authoring save, additive runtime apply, static/external model views, runtime view entry preparation, and managed import/export planning.
- `Navigation Builder`: active V1. Owns app menu/sidebar navigation structure,
  Form View/App Page/External Link targets, future App Module shape with nested
  subitems, root-only `Menu title` dividers, separate `App menu`/`Utility rail` editor tabs,
  `Element`/`Access` inspector tabs, fixed add choices with target type locked
  after creation, `Show in app menu` toggle with eye-off inactive badges, Dashboard
  locked without lock badge, Form View labels derived from selected View
  titles, optional icon picker for every editable non-title app menu item with
  `None`, draft/Save UX, and the access-facing layer for runtime navigation and
  rail utilities. Backend persistence and runtime sidebar projection live in
  the dedicated `platformstudionavigationbuilder` package with
  `ps_navigation_config` and `GET /app/navigation`; runtime `Menu title` items
  render as UI Lab-style section headings with empty/consecutive/trailing title
  suppression in tenant-web; real rail utility
  enforcement and real grants remain planned unless a later decision splits
  access into its own tool.
- `Action Builder`: planned. Owns authored events, view-triggered behavior, notifications, conditional field changes, and post-submit side effects. Do not collapse this into the current Form Builder save flow.
- `PDF Builder`: planned. Owns configured PDF templates and generated document output over authored/runtime data.
- `Report Builder`: planned. Owns reporting surfaces, report definitions, and analytical/read-only outputs over authored/runtime data.
- Future tools may be added under Platform Studio, but they should not widen Form Builder scope by default.

## Retrieval Rule

Read the tool map first. If a task mentions sidebar, access, events, PDF, reports, or generated documents, treat it as Platform Studio suite work, not automatically as Form Builder implementation work.
