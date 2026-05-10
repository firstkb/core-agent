# Form Builder Planned Work

Status: active planned-work memory
Last verified: 2026-05-10
Verification mode: implementation update plus tracked docs and targeted FE checks

This file preserves Form Builder planned work without turning it into active
implementation scope. Use it after the active Form Builder contracts, not
instead of them.

## Read First

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder.md`

## Code-Confirmed Current State

- Authoring model endpoints exist for list, create, detail, delete, view list, view create, view detail, view copy, view delete, authoring load/save.
- `/authoring` is canonical; `/draft` remains a compatibility alias.
- Managed model export endpoints exist for model bundle and data export.
- Runtime/preview list endpoints exist for meta, query, search suggestions, saved filters, favorite toggle, and record detail.
- `/app/me/favorites` lists runtime favorites.
- Runtime and preview APIs are separate route namespaces.
- Runtime Form View APIs are guarded by the Navigation Builder derived target
  evaluator; future Form Builder runtime endpoints must reuse that guard.
- Runtime apply remains additive-only and lives in `platformstudioformbuilder`.
- Subform Grid settings persist column selection/order in scope `viewSettings`, with legacy node-level `childGridColumns` only used as a non-empty compatibility fallback.
- Root View Sorting and Subtable sorting field pickers are constrained to active/list-visible Grid fields for their scope, including visible lookup-derived outputs.
- Authoring save uses a frontend single-flight guard and atomic model+view draft update so stale view conflicts cannot partially update the model from one save request.
- Canvas tree authoring preserves active scope, current parent, and selected node context after successful save.
- Choice field authoring templates default base `single_select` and `multi_select` Orientation to `Horizontal`.
- View tab Grid settings includes a transient switch above the field list to show only active/list-visible fields for easier sorting of large views.
- Choice button option styles use a strict semantic variant contract: `default`, `primary`, `secondary`, `info`, `success`, `warning`, or `danger`; raw per-option colors are not runtime contract.
- Plain `short_text` and email/phone text fields can author `uniqueValue: true`; disabled/false values are omitted from compact payloads. URL/suggest text presets are excluded. Runtime uniqueness enforcement remains separate follow-up work.
- Canvas attention markers propagate changed Subform-scope child nodes to the parent Subform node and root-scope ancestors.
- View-list warning triangles are topology drift indicators only. Field setting changes and layout-only blueprint edits do not advance `modelStructureVersion`; field add/remove, scope moves, and subform-scope topology changes do.
- Form Builder does not expose View Active/Inactive status or controls. `isActive` is retired from Form Builder view config and new `ps_view.definition_json` payloads; old payloads may be tolerated and dropped. Backend `ps_view.is_active` / API summary values remain deprecated compatibility metadata for now. Navigation Builder owns sidebar/runtime exposure and placement.
- Managed multiple lookup fields and non-lookup `multi_select`/`tags` have code-backed multivalue bridge-table support.
- Form Builder palette grouping treats each library field definition's explicit `section` as the source of truth; `Long text historical` belongs under `Ready-made fields`, not `Basic fields`.
- Generic `DB lookup`, `DB lookup value`, and `DB lookup multi` source picker authoring supports `lookupConfig.filters[]`; the current UI exposes only `Only active records`, saved as `{ field: "active", operator: "eq", value: true }` when the selected source has a boolean `active` field. Form Builder authoring work for DB LOOKUP filters is complete for the current scope; Form render/runtime application remains a separate implementation stream.
- Preset DB lookup shortcuts `Contact` / `Contacts`, `Company` / `Companies`, and `Project` / `Projects` author display templates and explicit preset filters in Form Builder. Preset filters save to `lookupConfig.filters[]` with `operator: "in"`; active-record filtering is not exposed as a preset Form Builder setting. Preset filter values are selected through the shared tenant dictionary routes using two-line Combobox options rather than raw id text inputs, with 300 ms remote-search debounce, first-page loading, and additional pages loaded on scroll.
- The shared tenant dictionary module supports named dictionaries `companies`, `companyTypes`, `contacts`, `jobtypes`, and `projects` through `GET /app/dictionaries/{dictionaryKey}/options`, plus generic ordinary lookup sources through `POST /app/dictionaries/options/query` using `sourceModel`, selected display/search/sort/stored-value fields, `filters[]`, search, ids, and paging. It is route-level tenant-secure only for now; dictionary-specific access rules are still future scope.
- Static/external model work includes code-backed seed migrations for `state`, `timezone`, `companytype`, `jobtype`, `events`, `mails`, `users`, `company`, `projects`, `industry_size`, and `industry_type`; exact table-by-table/static lookup details beyond these seeds still require retained exact-detail docs.
- `Projects` is available as a locked external Form Builder model/view with `Project #` default sorting, Main/Details tabs, Company/Contact/State/Industry lookups, suggest-text project metadata fields, status options, and canonical `industry_size_id` / `industry_type_id` lookup columns replacing old `projects.size` / `projects.type`.
- Static seeded form layouts require model-owned `layoutBlueprint.containers[].containerKey` and view-owned container UI nodes to use the same canonical keys. Missing UI node `containerKey` values can create duplicate empty tabs/sections during authoring reconciliation.

## Planned / Open Work

- Next Form Builder field work should focus on `Checklist subform`: review the current palette item, schema/runtime expectations, authoring UI, and Form render behavior before changing implementation.
- Navigation Builder must own runtime exposure, sidebar placement, and runtime grant assignment for `{ targetType: form_builder_view, modelId, viewId }`.
- Future Navigation Builder bridge in Form Builder should surface runtime exposure
  without moving ownership into Form Builder: model/view list row action `Add to
  navigation` or `Configure navigation`, workspace View tab status `Shown in
  <navigation path>` or `Not in navigation`, and deep link to Navigation Builder
  for placement/access edits.
- Future cleanup should remove or fully deprecate Form Builder API request/summary usage of `isActive`, then evaluate dropping `ps_view.is_active` with a dedicated migration once Navigation Builder exposure is implemented and verified.
- Platform Studio preview runtime endpoints still need a dedicated preview access guard.
- Larger runtime record/list/create/edit/save behavior should move to future `platformstudioformruntime`; do not keep expanding `platformstudioformbuilder` by default.
- Post-submit side effects, notifications, integrations, workflow triggers, async retries, and side-effect failure reporting should move to future `platformstudioformactions`.
- Runtime create/edit/save record flows are future runtime package work; current code has runtime list/read scaffolding.
- Import model is planned from the managed export bundle, but no active import route/service exists yet.
- Import data is planned for managed models, but no active import route/service exists yet.
- Final `Export data` product semantics remain open: raw table, authored/runtime view, or both.
- Static/external multivalue storage remains deferred to a future explicit slice.
- Destructive/data-preserving runtime migration mode is future scope; ordinary runtime apply remains additive-only.
- Lookup field runtime/query handling still needs implementation for authored preset filters and display template output for `Contact`, `Project`, `Company`, `Reported By`, and similar lookup-heavy presets, plus expansion of generic `db_lookup` filters beyond the current active-record shortcut, including lookup-aware operators, display outputs, stored values, and derived values.
- Lookup-heavy filter compiler improvements remain follow-up for `Contact`, `Project`, `Company`, `Reported By`, and similar lookup presets.
- The 14 retained exact-detail docs remain until typed schemas, tests, generated registries, or code-backed docs replace their payload detail.

## Do Not Misread

- `Save` is not site publication.
- Runtime routes existing today does not mean runtime grants are solved.
- Static model ids may use underscore storage ids; authoring save validation compares normalized ids, not raw path strings.
- Export bundle support does not mean import implementation exists.
- `platform-studio-core` existing today does not mean Form Builder field registry/schema replacement is complete.
- Retained exact-detail docs are opt-in payload references, not active ownership docs.

## Verification Sources

- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/**`
- `platform/frontend/packages/platform-studio-core/**`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-replacement-roadmap.md`
