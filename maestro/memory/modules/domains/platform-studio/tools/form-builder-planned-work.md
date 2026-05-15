# Form Builder Planned Work

Status: active planned-work memory
Last verified: 2026-05-14
Verification mode: implementation update plus tracked docs and targeted FE/BE checks

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
  Managed storage apply commits before SQL view refresh, and data views are
  refreshed with `CREATE OR REPLACE VIEW` so dependent lookup/grid views do not
  block additive column creation. If view refresh still fails after storage
  succeeds, the save response returns a partial runtime apply warning.
- Subform Grid settings persist column selection/order in scope `viewSettings`, with legacy node-level `childGridColumns` only used as a non-empty compatibility fallback.
- Root View Sorting and Subtable sorting field pickers are constrained to active/list-visible Grid fields for their scope, including visible lookup-derived outputs.
- Root View row layout supports one visible Grid field in
  `viewSettings.list.rowLayout.secondaryRowFieldId`; runtime list meta emits it
  as a Collection Table secondary row, omits it from header columns, keeps it in
  fields/search/query, and resolves lookup fields through the same label/output
  alias used by the visible Grid projection.
- Grid authoring no longer offers every lookup-derived alias as an automatic
  selectable column. Authors expose lookup aliases through explicit
  `View-only field` nodes, which then become Grid targets using the view-only
  label. Root `Doc.id` is exposed the same way through `root_record_id`; when
  selected it persists as `root::record_id`, renders runtime `_id` as `doc_id`,
  remains table searchable, and is excluded from search suggestions. Legacy saved
  `field::lookup_output::...` Grid columns remain readable for compatibility.
- Generic DB lookup label output joins authored display fields with comma-space
  (`first, second`). Runtime list lookup label cells use
  `displayFormat: leading_comma_bold` so Collection Table visually emphasizes
  the text before the first comma while keeping backend output as plain text.
  Existing compiled runtime SQL views receive this after the next runtime apply
  for that model/view.
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
- Runtime Form supports the first `Checklist subform` slice: backend form-load
  emits a checklist matrix, answer upsert saves only selected checklist rows,
  active lookup rows are unioned with saved inactive rows, and the shared form
  renderer displays flat/category checklist UI with answer buttons, optional
  detail fields, required validation, and reveal/focus behavior.
- Form Builder palette grouping treats each library field definition's explicit `section` as the source of truth; `Long text historical` belongs under `Ready-made fields`, not `Basic fields`.
- Generic `DB lookup`, `DB lookup value`, and `DB lookup multi` source picker authoring supports `lookupConfig.filters[]`; the current UI exposes only `Only active records`, saved as `{ field: "active", operator: "eq", value: true }` when the selected source has a boolean `active` field. Form Builder authoring work for DB LOOKUP filters is complete for the current scope; Form render/runtime application remains a separate implementation stream.
- Preset DB lookup shortcuts `Contact` / `Contacts`, `Company` / `Companies`, and `Project` / `Projects` author display templates and explicit preset filters in Form Builder. Preset filters save to `lookupConfig.filters[]` with `operator: "in"`; active-record filtering is not exposed as a preset Form Builder setting. Preset filter values are selected through the shared tenant dictionary routes using two-line Combobox options rather than raw id text inputs, with 300 ms remote-search debounce, first-page loading, and additional pages loaded on scroll.
- View Filter authoring excludes multiple-value lookup fields and lookup-derived alias fields from selectable filter targets. `contact_lookup` View Filters expose only `User Active Account` and `By User's Company` as switches, both off by default; `Contact Job Type` is not a View Filter clause. Single-value `company_lookup` View Filters expose only `Business Unit is User's Company` and `Main Company is User's Company` as switches, both off by default; Division is not exposed because there is no source field/contract for it. Single-value `project_lookup` View Filters expose only `Project is in User's Access List` as a switch, off by default.
- Runtime list View Filter compilation applies single-value `contact_lookup`, `company_lookup`, and `project_lookup` semantic filters for non-root users and ignores those user-scoped lookup filters for root users. Matching semantic clauses across multiple fields of the same lookup preset are grouped with OR, while different semantic groups are combined with AND. `User Active Account` compares the contact lookup storage id to the current user business id; `By User's Company` compares the contact lookup-derived company id to the current user's company id. `Business Unit is User's Company` compares the company lookup storage id to the current user's company id; `Main Company is User's Company` resolves through `company.main_company_id`. `Project is in User's Access List` resolves through `projectsaccess(project_id, user_id)` for the current user's `users.id`.
- The shared tenant dictionary module supports named dictionaries `companies`, `companyTypes`, `contacts`, `jobtypes`, and `projects` through `GET /app/dictionaries/{dictionaryKey}/options`, plus generic ordinary lookup sources through `POST /app/dictionaries/options/query` using `sourceModel`, selected display/search/sort/stored-value fields, `filters[]`, search, ids, and paging. It is route-level tenant-secure only for now; dictionary-specific access rules are still future scope.
- Static/external model work includes code-backed seed migrations for `state`, `timezone`, `companytype`, `jobtype`, `events`, `mails`, `users`, `company`, `projects`, `industry_size`, and `industry_type`; exact table-by-table/static lookup details beyond these seeds still require retained exact-detail docs.
- `Projects` is available as a locked external Form Builder model/view with `Project #` default sorting, Main/Details tabs, Company/Contact/State/Industry lookups, suggest-text project metadata fields, status options, and canonical `industry_size_id` / `industry_type_id` lookup columns replacing old `projects.size` / `projects.type`.
- Static seeded form layouts require model-owned `layoutBlueprint.containers[].containerKey` and view-owned container UI nodes to use the same canonical keys. Missing UI node `containerKey` values can create duplicate empty tabs/sections during authoring reconciliation.

## Planned / Open Work

- `Checklist subform` Form Builder authoring shortcut is implemented for the current slice: it creates the checklist child scope with managed/locked default `Item` (`db_lookup`), `Result` (`single_select` button answers), and `Notes` (`long_text`) fields, stores `checklistConfig.lookupFieldId`, `checklistConfig.resultFieldId`, `checklistConfig.notesFieldId`, and `checklistConfig.grouping`, and exposes lookup/result/grouping controls in the Element inspector. Optional `Notes` should be hidden with node visibility instead of deleted. Checklist-level palette is restricted to `Short text`, `Date`, `Single select`, `Heading`, and `Text`. Deleting a subform now removes the subform node, scoped fields, and model schema scope together to prevent child fields from reappearing as root/unplaced fields. Checklist item-source metadata is now an accepted runtime convention: Form render auto-detects optional source fields `answer_options` (`Pass|Fail|N/A` using `|` delimiter), `answer_required` (`boolean`), and `visible_when` (`7=Fail` style single dependency metadata). Remaining checklist work belongs to richer source configuration UX, visible-when behavior beyond metadata transport, file/photo support, and any Corrective Action integration.
- Runtime write has a managed-storage safety net for missing scalar columns.
  Keep it as a runtime protection, not as the primary Form Builder apply path.
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
- Lookup field runtime/query handling still needs implementation for remaining authored preset filters and display template output for similar lookup-heavy presets, plus expansion of generic `db_lookup` filters beyond the current active-record shortcut, including lookup-aware operators, display outputs, stored values, and derived values.
- Lookup-heavy filter compiler follow-up remains for future multivalue lookup filters. The single-value `contact_lookup`, `company_lookup`, and `project_lookup` compiler rules are code-backed; do not add FE-only hidden flags for the completed semantic grouping behavior unless the filter schema is explicitly expanded.
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
