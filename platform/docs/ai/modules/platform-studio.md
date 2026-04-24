# Module Memory — Platform Studio

Status: active
Date: 2026-04-13

## Read this when

- working on Platform Studio UI
- changing builder routes in `tenant-web`
- changing `platform-studio-core`
- changing the Forms / Navigation builder direction

## Current source of truth surfaces

- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-import-bundle-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-package-boundary-plan-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-view-strategy-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-routes-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-access-and-entry-context-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md`
- `platform/frontend/docs/platform-studio/form-builder-static-models-execution-plan-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md`
- `platform/frontend/docs/platform-studio/v2-foundation-brief.md`
- `platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md`
- `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`
- `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`
- `platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md`

## Confirmed code surfaces

- `platform/frontend/apps/tenant-web/src/features/platform-studio/**`
- `platform/frontend/packages/platform-studio-core/**`
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- `platform/backend/migrations/postgres/tenant/040_platform_studio_form_builder_drafts.sql`
- `platform/backend/migrations/postgres/tenant/041_platform_studio_form_builder_authoring_locks.sql`

## Locked invariants

- Platform Studio is the umbrella builder surface in `tenant-web`
- Form Builder is the first active Platform Studio tool
- Navigation Builder and Action Builder are planned Platform Studio tools, but not implementation-active yet
- Platform Studio UI stays app-local in `tenant-web`
- shared extraction is limited to typed contracts and validation helpers in `platform-studio-core`
- do not turn old builder UI into the baseline again
- `ezform` is an interaction reference only, not code to copy
- old-code reference is opt-in historical material, not default source of truth
- backend owns physical storage naming, DDL generation, and persistence validation
- builder UI authors business-level model and layout intent, not raw database schema implementation
- user-facing Form Builder language is `Model` and `View`
- active Form Builder route params are `modelId` and `viewId`
- `modelId` route params resolve by the stable model identity
- `viewId` route params resolve by stable view id, not `view.key`, title, or database GUID
- legacy `EntityDefinition` and `FieldDefinition` names may remain only as compatibility aliases during migration
- the first backend-facing Form Builder pass uses integer `modelStructureVersion`
- view drift is driven by `modelStructureVersion > lastAlignedModelStructureVersion`
- `root` may lock `model` and `view` separately
- a newly added field may still update the model label before first successful `Save`
- after the first successful `Save`, the `default` view may still update canonical field labels
- default-view label-only rename is metadata-only and must not create structure drift
- non-default views keep rename as view-only
- Form Builder `Save` now targets `save + runtime apply`, but it is still not site publication; Navigation Builder and privileges remain a separate exposure layer
- each view now carries an explicit `isActive` authoring flag behind the eye indicator in the views list
- canonical tenant API route naming for authoring state is `/authoring`; legacy `/draft` remains only as a temporary compatibility alias and not the intended user-facing lifecycle language

## Product direction

Platform Studio tool map:

- Form Builder
- Navigation Builder
- Action Builder
- future tools may be added later

Current working route model from docs:

- `/builder/forms`
- `/builder/forms/:modelId`
- `/builder/forms/:modelId/views/:viewId`

Legacy compatibility remains acceptable for:

- `/builder/forms/:modelId/screens/:viewId`
- `/builder/forms/:dataSchemaId/ui/:uiSchemaId`

Visible copy and UX can evolve, but active contract naming must now stay stable enough to support backend integration.

## Important cross-stack rule

The frontend may change visible product language.
The backend contract should keep stable internal domain naming.
Do not bind backend persistence design directly to temporary UI copy.

The first backend-ready Form Builder contract is locked around:

- model list/detail
- view list/detail
- layout draft tree
- lock state
- save semantics

Current implemented backend-ready slice:

- `ps_model` and `ps_view` draft metadata tables exist in tenant schema and now persist dedicated `model_locked`, `view_locked`, and `is_active` authoring fields across the first authoring slice
- `api-tenant` now exposes model list/create/detail, view list/create/detail/copy/delete, and canonical authoring `load/save` routes for one model/view workspace, with legacy `/draft` aliases still accepted temporarily
- `Create Model` seeds the first default view in the same backend action and returns a selected view for direct workspace redirect
- opening the first view for a brand-new model with no fields must not auto-insert authored layout nodes
- backend authoring persistence is now canonicalized around model-owned `dataSchema + layoutBlueprint` in `ps_model.definition_json` and view-owned `uiSchema` in `ps_view.definition_json`
- canonical `/authoring` load/save now uses the explicit three-schema split while keeping lazy compatibility mirrors for older drafts during the rollout
- `Create View` now clones the aligned default-view `uiSchema` baseline, including canonical view-only nodes such as `Doc.id`; if the default view is stale against the current `modelStructureVersion`, backend falls back to a fresh `uiSchema` from the current `dataSchema + layoutBlueprint`
- `Copy View` now clones the source `uiSchema` exactly while aligning the copied view to the current `modelStructureVersion`
- opening any view must reconcile missing model fields and blueprint containers against backend-issued canonical `containerKey` values, route unresolved fields into explicit per-scope `Unplaced fields`, and keep `Save` active until that reconciliation is persisted
- authored scope-root fields are now a first-class three-schema case through the reserved `layoutBlueprint.fieldPlacements[].containerKey = "__scope_root__"` key; unresolved fields still go to `Unplaced fields` instead of silently falling back to root
- authoring draft model JSON now carries a lightweight per-field `schemaScopeKey` hint so root-vs-subform field intent can survive save/reload before the broader model-scope contract lands
- authoring draft model JSON now also carries model-level `schemaScopes`, and new views use that registry to materialize missing subform anchors instead of treating subform topology as view-local only
- toggling model structure lock is an administrative authoring change only; it must not advance `modelStructureVersion` or manufacture view-drift warnings when schema/layout are unchanged
- `tenant-web` now consumes the backend authoring endpoints through a route-scoped authoring provider instead of relying on placeholder-only model/view list mutations
- `tenant-web` no longer injects bundled mock model/view records when the backend-backed authoring cache is empty
- `tenant-web` private shell now mounts the shared `ui-kit` `TopLoader` and drives it from `@platform/api-client` inflight request activity, so Form Builder transport requests show viewport-level progress while local content states remain explicit
- `tenant-web` workspace now hydrates and saves the explicit three-schema payload, shows a three-pane debug modal for `Data Schema`, `Layout Blueprint`, and `UI Schema`, and treats backend-issued `containerKey` values as canonical during reconcile
- the first stable three-schema rollout now makes the `default` view the only blueprint editor; non-default views remain `uiSchema`-only authoring surfaces, but that still includes local UI composition and presentation changes such as visibility, rules, grid/filter settings, local reorder, and placement of already-existing fields
- deleting a non-default view removes only that view; deleting a default view promotes a remaining view to `default + active`; deleting the last remaining view is rejected
- Form Builder lock and access policy is now hardened around real root identity: only `level: 100` root may toggle `Lock model structure` and `Lock this view`
- when `lock model` is enabled, non-root users may still create/manage allowed views but may not change model-owned `dataSchema + layoutBlueprint`
- when `lock view` is enabled, non-root users may not open that Form Builder workspace and may not save/copy/delete that locked view; backend hard-deny is now the source of truth, with tenant-web aligned to hide or disable the corresponding actions
- static/external Form Builder models are now root-only in practice: non-root users do not see them in model lists and backend denies direct load/save/delete/view-management access
- deferred filter follow-up: view filters currently compose saved conditions with `AND`; revisit the filter contract so repeated lookup-like entities can support `OR` within the same logical family, for example `active user = Contact1 OR Contact2` when multiple `DB lookup Contact` fields participate in one view filter set
- deferred filter cleanup pass: audit and correct authored/runtime filter behavior for `Contact`, `Project`, `Company`, multiselect-backed filters, and `Reported By` so lookup presets and multivalue fields behave consistently in view filters
- accepted next backend slice: `Save` persists authoring state first and then runs additive runtime apply
- additive runtime apply may create missing managed tables, add missing columns, and create or deterministically recreate SQL data views and grid SQL views
- additive runtime apply now also emits lookup-derived SQL view columns for single-value `db_lookup` fields in grid/data views, including preset `contact/company/project` families plus generic managed-model lookup `__label`
- additive runtime apply now exposes multivalue lookup grid/data outputs `__labels` and `__count` from the shared multivalue bridge table
- runtime grid views now project system columns plus the visible authored `viewSettings.list.columns` bindings instead of cloning the full canonical data view; empty authored grids fall back to system columns only, plus the parent FK for child scopes
- runtime SQL view identifiers now use deterministic shortening with a hash suffix when raw canonical/grid view names would exceed PostgreSQL's 63-byte identifier limit; this avoids the collision/truncation issue seen on long subform grid names
- tenant lookup runtime now has live tenant reference dictionaries `state` and `jobtype`; `company__state` resolves through `state.state_name`, while `jobtype` is prepared for later users/title normalization without changing the current `users_title` text contract yet
- generated Form Builder managed tables now persist `tenant_id`
- generated canonical data views and grid views now expose `tenant_id`
- tenant-scoped lookup joins and multivalue subqueries now include `tenant_id`
- generated runtime indexes are now tenant-aware: `tenant_id`, `(tenant_id, _guid)`, `(tenant_id, <parent_fk>)`, `(tenant_id, <lookup_fk>)`, and multivalue owner/field composites
- additive runtime apply must not delete tables, columns, or SQL views
- if runtime apply fails after authoring save succeeds, the saved authoring state remains persisted and the UI should surface `saved, but runtime apply failed`
- backend authoring/runtime responses should prefer anticipatory diagnostic context over generic failure text; when runtime apply or similar post-save execution fails, the response should include enough context to avoid guesswork, at minimum `tenant_id`, affected `model_id`, affected `view_id`, and the underlying error text
- current runtime-apply failure responses now include structured context in `runtimeApply.context` plus a contextual message/warning payload so backend and UI can identify the failing tenant/model/view directly
- planned next UX follow-up: tenant app should visibly surface contextual `runtimeApply` failures in the workspace UI instead of relying on users to inspect network responses
- local tenant DB application is now confirmed for the documented local migrate path: `go run ./cmd/migrate --env ./env/migrate.local.env.example` applied `042_lookup_reference_tables` into `108-demo`, and `public.state` / `public.jobtype` are present
- current nuance: `jobtype.tenant_id` is populated as `0` during migration bootstrap because the dictionary seed runs outside tenant request context; if per-tenant seeded `jobtype` rows are required, that needs a follow-up tenant-aware seed/backfill slice
- current PostgreSQL runtime naming risk is reduced for SQL views via deterministic short-name hashing, but physical table names still use readable raw scope-storage keys and may eventually need the same treatment if root or subform keys grow further
- accepted next naming cutover: Form Builder runtime naming now targets `Runtime Naming Contract v1.1`
- v1.1 separates logical authoring keys from physical runtime aliases through immutable `model.rtAlias`, `scope.rtAlias`, and `view.rtAlias`
- v1.1 runtime metadata must be returned in `dataSchema.rootScope.runtime`, every `dataSchema.subformScopes[].runtime`, `uiSchema.rootScope.runtime`, and every `uiSchema.subformScopes[].runtime`
- accepted v1.1 runtime prefixes are now `ps_` for tables, `vw_` for canonical data views, and `vg_` for grid views
- accepted v1.1 cutover removes old runtime naming compatibility: on `Save`, backend creates missing runtime metadata if absent and then treats that metadata as canonical; legacy runtime objects are not preserved as a supported compatibility layer
- static models now have a frozen schema contract in `form-builder-static-models-schema-contract-v1.md`; first-slice static models are root-scope only, require explicit scope runtime metadata, and require explicit `runtime.sourceColumnName` on every source-backed field
- `suggest_text` is now accepted as a ready-made preset over `short_text`; it provides ajax-backed same-domain text suggestions, keeps plain scalar text storage, and allows custom values
- static models now have an explicit execution plan in `form-builder-static-models-execution-plan-v1.md`; the current next-step order is schema freeze, `suggest_text` field contract, `users` static-model design, then the remaining static models
- `users` static-model design now assumes three authored views: `Users` as the default full baseline, plus `Contacts` and `List of Accounts` as specialized secondary views
- Atlas task prompt for the static-model rollout is now fixed in `form-builder-static-models-atlas-task-v1.md`; it must start with reference tables (`state`, `timezone`, `companytype`, `jobtype`) and `company` before `users`
- static lookup fields now have an accepted naming policy in `form-builder-static-lookup-naming-policy-v1.md`; for static/external lookup-backed fields, `storageKey` stays logical (`user`, `company`, `state`) while the raw source FK column remains in `runtime.sourceColumnName` (`user_id`, `company_id`, `state_id`)
- accepted static-model access restriction: only `root` may see static models; static/external model schema is now treated as read-only even for `root`, while `root` may still manage static-model views; keep the capability split explicit as `canSeeStaticModels`, `canEditStaticModelViews`, and `canEditStaticModelSchema`, but `canEditStaticModelSchema` is currently enforced as false in tenant app/backend for static models
- current accepted import-bundle planning contract now lives in `form-builder-import-bundle-contract-v1.md`; the current `Export model` JSON is sufficient as the source file for future cross-tenant import of `managed` models and their views, importer must normalize lifecycle/version fields and ignore source-tenant noise, and export now includes baseline `dependencies`, `importPolicy`, `exportMeta`, and `runtimePolicy` sections while richer `external/static` portability detail remains a follow-up
- current Form Builder model list behavior is now part of the active UX contract: the left panel supports local search by model title/display/key, static models render with a database icon, managed models render with the form icon, and static models keep a reduced action surface
- current export policy is now explicit: `Export model` and `Export data` are supported only for `managed` models; static/external models do not expose those actions in tenant-web and backend rejects direct export calls for them
- current `Export model` bundle is designed as the future source file for `Import model`; it exports model-owned `dataSchema + layoutBlueprint`, all view `uiSchema` payloads, and minimal `dependencies`, `importPolicy`, `exportMeta`, and `runtimePolicy`
- current `Export data` policy is intentionally narrower and unresolved long-term: it exports from the real managed root table with CSV headers derived from field labels and a leading `Doc.id` column, but there is a planned follow-up decision to determine whether Form Builder should keep raw-table export, add a separate view-based human-readable export, or support both modes
- current runtime-view strategy is now fixed in `form-builder-runtime-view-strategy-v1.md`; authored Form Builder `view` is the canonical runtime entrypoint, runtime delivery is per-view rather than per-model, builder preview and future sidebar/navigation use the same runtime engine, and a separate model-only viewer is explicitly rejected
- current runtime-view route direction for real app navigation is `/app/forms/:modelId/views/:viewId`; external record routes use `guid`, with create at `/new`, edit at `/edit/:docGuid`, and canonical record-read target at `/view/:docGuid`, while the final detail presentation may still be either a page or a route-driven modal
- current Platform Studio preview entry route is `/app/platform-studio/forms/:modelId/views/:viewId`; this is a preview/authoring route namespace, not a second target type and not a Navigation Builder target
- current runtime-routes contract is now fixed in `form-builder-runtime-routes-contract-v1.md`; Navigation Builder resolves `form_builder_view` to the runtime list route only, record-specific paths remain runtime-internal transitions, and v1 query params are intentionally limited to `returnTo` plus `presentation=page|modal` on the read route
- current runtime access and entry-context contract is now fixed in `form-builder-runtime-access-and-entry-context-v1.md`; runtime ACL is attached to the typed target `{ targetType: form_builder_view, modelId, viewId }`, `/app/forms/...` uses runtime/navigation grants, `/app/platform-studio/forms/...` uses Platform Studio access rules, and backend should branch by route namespace rather than an extra request-source flag
- current runtime entry split is now partially implemented: Form Builder `View data` opens the Platform Studio preview route `/app/platform-studio/forms/:modelId/views/:viewId`, while Navigation Builder and favorites continue to use `/app/forms/:modelId/views/:viewId`; backend now mirrors preview runtime APIs under `/app/platform-studio/forms/:modelId/views/:viewId/runtime/*`, and the remaining follow-up is to enforce the two dedicated guards on the runtime vs preview API namespaces
- current access-enforcement staging rule is explicit: do not invent temporary runtime grants before Navigation Builder ACL exists; until that ACL model is implemented, the runtime namespace stays on current tenant-auth baseline, preview/runtime route splitting is treated as preparatory infrastructure, and an optional future helper seam such as `authorizeRuntimeViewAccess(...)` should stay allow-by-default until real Navigation Builder grants exist
- current Form Builder runtime list now applies authored `filterDefinitions.defaultFilters` both to the table query and to `search-suggestions`, so search suggestions stay inside the same default-filter context as the visible grid
- current Form Builder `View data` runtime now supports saved filters and favorites with the same collection-table UX pattern family as admin surfaces; both persist per tenant user and per runtime `form_builder_view` surface in tenant storage, favorite toggles are available from runtime and preview list entrypoints, and tenant rail favorites resolve only to canonical runtime routes `/app/forms/:modelId/views/:viewId`
- static global reference tables `state` and `timezone` are now guid-enabled via tenant migration `004_platform_studio_static_model_guid_backfill.sql`; their source tables now carry `guid`, `ps_model.dataSchema.rootScope.runtime.sourceGuidColumn` is backfilled to `guid`, and `vw_state` / `vw_timezone` now project `_guid` from the real source column so runtime record view may be enabled for those static models
- tenant migration `005_platform_studio_static_model_users.sql` seeds the static/external `users` model as locked/views-only with three authored views: `Users` as the default full baseline, `Contacts`, and `List of Accounts`; the seed intentionally excludes `password`, `username`, and `ets_admin`, keeps `ssn` only in the default `Users` field union, and creates immediate runtime SQL views `vw_users`, `vg_users__default`, `vg_users__contacts`, and `vg_users__accounts`
- tenant migration `006_platform_studio_static_model_company.sql` seeds the static/external `company` model as locked/views-only with the user-facing model name `Company` and default view `Business Units`; it includes `Contact Name` as `short_text`, uses `suggest_text` for `City` and `Zip`, maps lookup-backed source columns for business unit type, main company, state, and timezone, and creates immediate runtime SQL views `vw_company` and `vg_company__default`
- accepted backend package split plan now lives in `form-builder-package-boundary-plan-v1.md`; `platformstudioformbuilder` remains the authoring/control-plane owner, runtime list/record and future create/edit/save should move into a dedicated `platformstudioformruntime` package, and post-submit side effects should land in `platformstudioformactions` instead of continuing to expand the builder package
- deferred runtime filter follow-up: the lookup/token filter slice is still unfinished; lookup-oriented authored filters still need a dedicated runtime compiler path before lookup-heavy filter sets for `Contact`, `Project`, `Company`, `Reported By`, and similar presets can be considered complete
- planned next import/export follow-ups are now explicit:
  - `Import model` from the managed export bundle
  - `Import data` for managed models
  - final product decision on whether `Export data` should export from the real table, the authored view/runtime SQL view, or both through separate actions

## Important docs to treat as reference-only

Read only if the task really needs them:

- `platform/frontend/docs/platform-studio/old-code-reference/**`
- `platform/frontend/docs/vendor/**`
- `platform/docs/archive/agent-prompts/platform-studio-continue*.md`

## When to update memory

Update this file when:

- route model changes
- shared builder contract layer changes
- backend boundary for builder persistence becomes concrete
- a second builder becomes implementation-active beyond Form Builder
