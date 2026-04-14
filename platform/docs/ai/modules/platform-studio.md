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
- `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md`
- `platform/frontend/docs/platform-studio/v2-foundation-brief.md`
- `platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md`
- `platform/frontend/docs/platform-studio/data-schema-storage-rules.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`
- `platform/frontend/docs/platform-studio/form-builder-field-catalog.md`

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
- a newly added field may still update the model label before first successful `Save`; after that, ordinary canvas rename is view-only
- Form Builder `Save` is authoring save only; site publication and privileges are deferred to Navigation Builder
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
- deferred follow-up policy task: harden root-only authoring locks so only `level: 100 root` can toggle model/view lock state; when `lock model` is enabled, non-root users stay limited to creating/managing views while `root` keeps builder access and default-view control; when `lock view` is enabled for a view, non-root users cannot enter that Form Builder workspace while `root` retains access and control
- publish-time storage generation is still deferred

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
