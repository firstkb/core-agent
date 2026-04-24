# Current State

Status: active snapshot
Snapshot date: 2026-04-15

Confidence classes:
- `code-confirmed` = directly observed in code, config, imports, or repository tree
- `doc-confirmed` = stated in current canonical docs and treated as active contract, but not re-verified everywhere in code during this pass
- `inferred` = strong synthesis across code/docs, still an interpretation
- `planned` = intended direction, not yet implemented

## Code-confirmed platform state

### Backend

- A Go backend exists as a modular monolith under `platform/backend`.
- Active runtime entrypoints observed in code:
  - `cmd/api-admin`
  - `cmd/api-tenant`
  - `cmd/auth`
  - `cmd/migrate`
- Admin modules observed in code include navigation, profile, tenant management, employees list, module registry list, module registry management, module registry grants, and access policy.
- Tenant module currently confirmed in code:
  - `tenant/profile`
  - `tenant/platformstudioformbuilder`
- Shared backend areas observed in code include authentication, sessions, collection-table helpers, collection preferences, audit, notifications, and forms.
- Cross-module backend direction now prefers anticipatory failure diagnostics over generic post-action errors: when execution fails after a user action is accepted or partially persisted, responses should carry enough context to identify the failing tenant, target object, and underlying error without guesswork.

### Frontend

- The frontend workspace exists under `platform/frontend` with pnpm + turbo.
- Active apps observed in code:
  - `platform-admin-web`
  - `tenant-web`
- Shared packages observed in code include:
  - `api-client`
  - `app-shell`
  - `auth-core`
  - `collection-table`
  - `design-tokens`
  - `forms`
  - `i18n`
  - `install-helper`
  - `platform-studio-core`
  - `tenant-core`
  - `ui-kit`

### Cross-stack

- Collection Table now exists as a frontend workspace package under `platform/frontend/packages/collection-table` and is consumed by the admin app module-registry and Employees list pages.
- Collection Table shared-capability backlog still includes FE/BE completion for optional `XLS export`, `view`, and `pdf` features; these are intended as opt-in table capabilities, not mandatory for every consumer.
- FE/BE coordinated work now has an installed Atlas-based control workflow under `.agents/skills/ramp-conductor/` plus `platform/docs/ai/prompts/*`, `templates/*`, and `runs/*`.

## Doc-confirmed active contracts

### Auth and session alignment

- The active auth contract is cookie-refresh based.
- `packages/api-client` uses `credentials: "include"` for auth endpoints.
- `packages/auth-core` persists access token and expiry, not an active refresh token.
- `packages/auth-core` now scales its refresh lead window from the token lifetime, so short-lived access tokens do not trigger an immediate post-login refresh loop.
- Non-401 refresh failures in `packages/auth-core` now preserve the session hint and avoid clearing a still-valid access token during bootstrap or scheduled refresh retries.
- `packages/auth-core` now keeps expired sessions in a retrying recovery state after temporary refresh failures instead of dropping straight to sign-in, while expired-session `401` and `403` refresh failures still clear local auth state.
- `packages/auth-core` now waits longer than the cross-tab refresh lock TTL before giving up on a sibling refresh owner, so a stalled owner is less likely to force follower tabs into a false logout.
- admin and tenant apps now preserve mounted private-shell profile/navigation state during same-user silent access-token refresh instead of dropping back to a fullscreen bootstrap loader.
- admin and tenant app bootstrap revalidation is no longer tied to every same-user access-token rotation.
- frontend profile and admin-navigation bootstrap calls can now retry once after `401`/`403` by recovering the access token through `auth-core` before forcing sign-out.
- Frontend auth follow-up docs remain a live cleanup surface, not a closed topic.

### Admin control plane

- Module Registry backend phases 1–5 are documented as completed.
- Admin navigation exists as a first-class backend contract and remains separate from profile bootstrap.
- Current non-root rollout slice is tenant onboarding.
- Root-only admin list surfaces now include Module Registry, Employees, and Tenant inventory.
- Tenant inventory now has a real root-only collection-table surface under `/app/admin/tenants/list/*`, plus the admin-app host page at `/admin/tenants`; non-root rollout remains onboarding-only.

### Schema and tenancy baseline

- The master + tenant database split is an active contract.
- Tenant bundle + forward migrations are part of the current migration model.
- Tenant-aware design retains `tenant_id`.

### Frontend foundation and builder

- Shared frontend foundation docs are extensive and active.
- Platform Studio is the active reset direction for builder work.
- Platform Studio taxonomy is now locked around one umbrella plus multiple tools: Form Builder is active, Navigation Builder and Action Builder are planned.
- `@platform/platform-studio-core` is the shared non-UI contract layer for Platform Studio builders.
- The first Form Builder integration contract is now locked around model list/detail, view list/detail, layout draft tree, locks, and save semantics.
- `api-tenant` Form Builder now exposes concrete authoring endpoints for model list/create/detail, view list/create/detail/copy/delete, plus canonical authoring `load/save` routes under `/authoring`; `/draft` remains as a temporary compatibility alias only.
- `Create Model` now seeds the first default view in one backend action and returns a selected view for direct workspace redirect instead of leaving a view-less model shell.
- opening the first workspace for a brand-new model with no fields no longer auto-authors a `Main section`; that view stays empty until the user adds layout or fields.
- `api-tenant` Form Builder backend now persists model-owned `dataSchema + layoutBlueprint` in `ps_model.definition_json` and view-owned `uiSchema` in `ps_view.definition_json`, and canonical `/authoring` load/save now expose that explicit three-schema split while keeping lazy compatibility mirrors for older drafts during the rollout.
- `Create Model` now seeds empty model `dataSchema`, empty model `layoutBlueprint`, and a default-view `uiSchema`.
- creating an additional non-default view now clones the aligned default-view `uiSchema` baseline, including canonical view-only nodes such as `Doc.id`; if the default view is stale against the current `modelStructureVersion`, backend falls back to a fresh `uiSchema` seeded from `dataSchema + layoutBlueprint`.
- `Copy View` now clones the source `uiSchema` exactly while aligning the copied view to the current `modelStructureVersion`.
- opening any view now reconciles missing model fields and blueprint containers against backend-issued canonical `containerKey` values, routes unresolved fields into explicit per-scope `unplacedFieldIds`, and leaves `Save` active until that reconciled state is persisted.
- Form Builder three-schema drafts now also support explicit scope-root field placement through the reserved `layoutBlueprint.fieldPlacements[].containerKey = "__scope_root__"` key, so authored root-level fields round-trip without being downgraded into `Unplaced fields`.
- `tenant-web` now persists a lightweight per-field `schemaScopeKey` hint in authoring draft model JSON so root-vs-subform field intent can survive save/reload and be reused during later view reconciliation.
- `tenant-web` now also persists model-level `schemaScopes` in authoring draft model JSON and uses them to seed missing subform anchors in newly opened views, instead of relying only on view-local `subformScopes`.
- dedicated persisted `model_locked` and `view_locked` columns now back separate authoring lock semantics, while `ps_view.is_active` persists the explicit authoring active-view flag.
- toggling model structure lock is now treated as an administrative authoring change, not a structural schema mutation; it must not advance `modelStructureVersion` or create false view-drift warnings by itself.
- `tenant-web` Form Builder now consumes the real backend model/view authoring endpoints for Add Model, Add View, Copy View, Delete View, list/detail loading, direct workspace entry, and canonical `/authoring` load/save transport without publish-time DDL; `/draft` route naming remains only as a temporary compatibility alias, not product lifecycle.
- `tenant-web` no longer falls back to bundled mock Form Builder model/view records when backend-backed cache is empty; empty model/view state now stays genuinely empty until backend data is loaded.
- `tenant-web` private shell now mounts the shared `ui-kit` `TopLoader` and drives it from `@platform/api-client` inflight request activity, so viewport-level transport feedback runs during tenant API requests without replacing local loading/empty/error states.
- `platform-admin-web` private shell now mounts the shared `ui-kit` `TopLoader` and drives it from shared request-activity tracking; admin collection-table transport also joins that activity stream so module and employee list requests show the same viewport-level feedback as the tenant app without replacing local loading/empty/error states.
- `@platform/collection-table` quick-filter semantics now support implicit OR groups for repeated `contains` filters on the same field: the runtime displays one grouped token such as `[Module] Emp, Tenant`, preserves the underlying `quickFilters[]` entries for persistence, and backend admin collection-table services evaluate those same-field `contains` entries as OR within the field and AND across the remaining filter groups.
- `tenant-web` Form Builder now loads and saves the explicit three-schema payload, treats backend-issued `containerKey` values as canonical during reconcile, renders explicit per-scope `Unplaced fields`, and exposes `Data Schema`, `Layout Blueprint`, and `UI Schema` in the debug modal.
- the first stable three-schema rollout now restricts model and blueprint editing to the `default` view; non-default views remain `uiSchema`-only authoring surfaces and may still perform view-local UI composition and presentation changes such as visibility, rules, grid/filter settings, local reorder, and placement of already-existing fields, as long as model-owned `dataSchema + layoutBlueprint` remain untouched.
- deleting a non-default view removes only that view; deleting a default view promotes one remaining view to `default + active`; deleting the last remaining view is rejected.
- Form Builder authoring locks are now enforced against the real root actor: only `level: 100` root may toggle `Lock model structure` and `Lock this view`; when model lock is enabled, non-root stays limited to view-authoring only; when view lock is enabled, non-root may not open/save/copy/delete that view workspace.
- static/external Form Builder models are now root-only in tenant app behavior and backend enforcement: non-root users do not see them in model lists and backend denies direct detail/load/save/delete/view-management access.
- Form Builder model list now has local search by model title/display/key and type-aware model tiles; static models use the database icon, managed models use the form icon, and static models expose a reduced action surface.
- Form Builder `Save` now runs additive runtime apply after authoring persistence and already reconciles lookup-derived grid/data SQL outputs for single-value `db_lookup` fields (`contact/company/project` presets plus generic managed-model lookups) and multivalue lookup `__labels` / `__count` outputs through the shared multivalue bridge table.
- Form Builder runtime grid views now follow `viewSettings.list.columns` instead of cloning full data views; each grid view always keeps system columns, and empty child grids keep only system columns plus the parent FK.
- Form Builder runtime SQL view names now shorten deterministically with a hash suffix when raw canonical/grid identifiers would exceed PostgreSQL's 63-byte identifier limit, which removes the observed subform grid-name truncation/collision issue.
- Tenant lookup runtime now has live reference dictionaries `state` and `jobtype`; `company_lookup` resolves `__state` through `state.state_name`, while `jobtype` is present for later users/title normalization without changing the current `users_title` text-backed output yet.
- Form Builder managed runtime tables now persist `tenant_id`; canonical data views and grid views also expose `tenant_id`.
- Tenant-scoped runtime SQL now joins lookup targets and multivalue bridge rows through `tenant_id`, and generated runtime indexes now prefer tenant-aware composites for GUID, parent FK, lookup FK, and multivalue owner/field access.
- Form Builder accepted runtime naming direction is now `Runtime Naming Contract v1.1`: logical authoring keys stay separate from immutable physical runtime aliases, with runtime metadata returned in both canonical `dataSchema` scopes and canonical `uiSchema` scopes.
- Accepted v1.1 naming prefixes are `ps_` for tables, `vw_` for canonical data views, and `vg_` for grid views.
- Accepted v1.1 cutover is non-compatibility: if runtime metadata is absent during `Save`, backend creates and returns it; after that, the runtime metadata is canonical, and old runtime naming is not preserved as a supported compatibility layer.
- static-model phase 1 reference-table schema design now has a concrete draft in `platform/frontend/docs/platform-studio/form-builder-static-models-phase-1-reference-schema-pack-v1.md`; it defines exact schema packages for `state`, `timezone`, `companytype`, and `jobtype`, keeps `state` / `timezone` as global external references, keeps `companytype` / `jobtype` tenant-scoped, and makes the shared FE/BE runtime patch explicit instead of patching runtime first
- tenant migration `platform/backend/migrations/postgres/tenant/001_platform_studio_static_models_seed_reference_and_logs.sql` now seeds `ps_model` / `ps_view` metadata for `state`, `timezone`, `companytype`, `jobtype`, `events`, and `mails`; it is intentionally insert-if-missing so regenerated tenant bundles and existing tenant-local authoring edits do not overwrite each other, and its bundled `events` / `mails` schemas now directly use the accepted static-lookup contract: logical field `user`, physical source column `runtime.sourceColumnName = user_id`, and the full canonical field payload
- follow-up bundle requirement: static-model rollout is expected to ship both canonical data-view runtime (`vw_*`) and grid-view runtime (`vg_*`) for static tables, not only `ps_model` / `ps_view` authoring metadata
- Form Builder export behavior is now explicit: `Export model` and `Export data` are supported only for `managed` models; static/external models do not show those actions in tenant-web and backend rejects direct export calls for them.
- current `Export model` bundle is now the accepted future source for `Import model` of managed models across tenants.
- current `Export data` now exports from the real managed root table, not from `vw_*`, with a leading `Doc.id` column and field-label CSV headers; a later product decision is still required on whether data export should remain raw-table export, move to view-based export, or offer both modes.
- static/external Form Builder models are now views-only even for `root`: backend treats their schema as read-only, `canEditViewsOnly` is forced for those models, root may still manage authored views, and tenant-web hides/disables schema-editing affordances accordingly.
- current Form Builder runtime-view strategy is now fixed in `platform/frontend/docs/platform-studio/form-builder-runtime-view-strategy-v1.md`: authored `view` is the canonical runtime entrypoint, runtime delivery is per-view rather than model-only, builder preview and future Navigation Builder/sidebar entry should resolve the same `form_builder_view` target, and a separate model-only viewer is intentionally rejected.
- current Form Builder runtime route direction for real navigation is `/app/forms/:modelId/views/:viewId`; external record routes use `guid`, with create at `/new`, edit at `/edit/:docGuid`, and canonical read target at `/view/:docGuid`, while detail presentation is still allowed to end up either as a page or as a route-driven modal.
- current Form Builder Platform Studio preview route is `/app/platform-studio/forms/:modelId/views/:viewId`; this preview route is a separate entry context, not a second runtime target type.
- current Form Builder runtime-routes contract is now fixed in `platform/frontend/docs/platform-studio/form-builder-runtime-routes-contract-v1.md`: Navigation Builder resolves `form_builder_view` to the runtime list route only, record-level routes stay runtime-internal transitions, and v1 query params are intentionally minimal: `returnTo` plus `presentation=page|modal` on the read route.
- current Form Builder runtime access and entry-context contract is now fixed in `platform/frontend/docs/platform-studio/form-builder-runtime-access-and-entry-context-v1.md`: runtime ACL is attached to the typed target `{ targetType: form_builder_view, modelId, viewId }`, `/app/forms/...` requests are enforced through runtime/navigation grants, `/app/platform-studio/forms/...` requests are enforced through Platform Studio access, and backend should branch by route namespace rather than a separate request-source parameter.
- current Form Builder preview/runtime split is now partially implemented: `View data` in Platform Studio opens `/app/platform-studio/forms/:modelId/views/:viewId`, while Navigation Builder and favorites stay on `/app/forms/:modelId/views/:viewId`; backend now exposes mirrored preview-runtime APIs under `/app/platform-studio/forms/:modelId/views/:viewId/runtime/*`, and the remaining follow-up is to enforce dedicated runtime-vs-preview guards by API namespace instead of a request-source flag.
- current access-enforcement staging rule is explicit: do not introduce temporary runtime grants before Navigation Builder ACL exists; until Navigation Builder permissions are implemented, `/app/forms/...` runtime APIs remain on the current tenant-auth baseline, the route split is preparatory infrastructure only, and any future helper seam such as `authorizeRuntimeViewAccess(...)` should remain allow-by-default until the real ACL model lands.
- Local tenant DB application is now confirmed for the documented local migrate path: `go run ./cmd/migrate --env ./env/migrate.local.env.example` applied `042_lookup_reference_tables` into `108-demo`, and `public.state` / `public.jobtype` are present.
- Current nuance: `jobtype.tenant_id` is seeded as `0` during migration bootstrap because that seed runs outside tenant request context; if sandbox/demo require tenant-owned `jobtype` rows with tenant IDs like `100/101`, that needs a dedicated tenant-aware seed/backfill slice.
- Current PostgreSQL runtime naming risk is reduced for SQL views, but physical table names still use readable raw scope-storage keys and may need the same deterministic shortening approach later if authoring keys get longer.
- Collection Table is treated as its own reusable runtime/package domain; Module Registry is a proving surface, not the owner of the table contract.

## Inferred state

- Atlas should remain the single shared-memory owner for coordinated product work; FE/BE lanes should continue to propose deltas rather than finalize shared memory.
- The current workflow stack is ready for pilot usage but still early enough that prompt/template/script drift must be watched closely.

## Planned / deferred surfaces

- `cmd/worker` is described in backend target docs as a runtime surface, but is not present in code yet.
- `tenant-pwa` is a deferred documentation concept only.
- Cross-app Collection Table adoption is still a direction, but the frontend package extraction itself is now in place for admin-app consumers.
- Collection Table still has deferred shared-capability work for FE/BE `XLS export`, `view`, and `pdf` support.
- Navigation Builder and Action Builder remain planned Platform Studio tools; implementation has not started yet.
- Form Builder now has an accepted backend package-boundary plan: `platformstudioformbuilder` remains the authoring/control-plane package, while larger runtime record work should extract into `platformstudioformruntime` and post-submit side effects into `platformstudioformactions` before those slices become large.
- Form Builder runtime list now applies authored `filterDefinitions.defaultFilters` to both the grid query and `search-suggestions`, so default-filtered views keep suggestions in the same runtime scope as the visible table.
- Form Builder `View data` runtime now supports saved filters and favorites through the shared Collection Table flow; both persist per tenant user and per `form_builder_view` surface in tenant storage, preview favorites still save the canonical runtime target, and tenant rail favorites open only `/app/forms/:modelId/views/:viewId`.
- tenant migration `004_platform_studio_static_model_guid_backfill.sql` now backfills `guid` onto the global static tables `state` and `timezone`, updates their `ps_model` runtime metadata to `sourceGuidColumn = guid`, and recreates `vw_state` / `vw_timezone` so static runtime record view can rely on real `_guid` values instead of `NULL::uuid`.
- tenant migration `005_platform_studio_static_model_users.sql` now seeds the static/external `users` Form Builder model as locked/views-only with three authored views: `Users` default, `Contacts`, and `List of Accounts`; the accepted v1 model excludes `password`, `username`, and `ets_admin`, keeps `ssn`, and ships immediate runtime SQL views `vw_users`, `vg_users__default`, `vg_users__contacts`, and `vg_users__accounts`.
- tenant migration `006_platform_studio_static_model_company.sql` now seeds the static/external `company` Form Builder model as locked/views-only with the `Company` model name and a default `Business Units` view; the seed includes `Contact Name` as `short_text`, uses `suggest_text` for `City` and `Zip`, keeps source-backed lookup metadata for business unit type, main company, state, and timezone, and ships immediate runtime SQL views `vw_company` and `vg_company__default`.
- Form Builder still has deferred filter work: current view filters compose conditions with `AND` only; the contract still needs an `OR` path for repeated lookup-family entities such as multiple `DB lookup Contact` fields, plus a cleanup pass for `Contact`, `Project`, `Company`, multiselect-based filters, `Reported By`, and the unfinished lookup/token filter compiler path for lookup-family authored filters.
- Form Builder still has deferred import/export follow-up work for `Import model`, `Import data`, and the final product decision on whether `Export data` should represent the real table, the authored/runtime view, or two distinct export actions.

## Active workstreams

1. Auth and session alignment
2. Admin control plane hardening
3. Schema and tenancy baseline
4. Frontend foundation and Platform Studio
5. Collection Table packaging direction
6. Atlas-based control workflow pilot and run-artifact discipline

## Risks and hygiene

- Do not let module-registry-specific assumptions become the universal Collection Table contract.
- Keep new docs repo-relative; machine-local paths are not acceptable in active docs.
- Frontend `node_modules`, `dist`, and `.turbo` remain high-noise zones and must stay opt-in.
- Archived prompt artifacts remain historical context only.
- `platform/backend/env/Untitled` still looks stray and should stay out of canonical workflows until verified or removed.

## What to update after each major task

- update this file when active project state materially changes
- append durable decisions to `decisions-log.md`
- update the relevant module file if a boundary or contract changed

## Current recommended read targets by task

- auth/session task -> `modules/auth-and-session.md`
- admin navigation / access-policy task -> `modules/admin-control-plane.md`
- module registry task -> `modules/admin-module-registry.md`
- collection-table runtime or package-promotion task -> `modules/collection-table.md`
- migration, DB, or tenant isolation task -> `modules/schema-and-tenancy.md`
- builder task -> `modules/platform-studio.md`
