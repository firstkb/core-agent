# Frontend Docs

Entry point for the active frontend documentation set.

## Active Docs

- `ui-delivery-order.md`: canonical execution order for donor extraction, review, gap filling, and only then the main system template
- `package-boundaries.md`: canonical package responsibilities and import rules
- `collection-table-runtime-contract.md`: live working contract for the universal collection-table preset, backend split, and later shared-layer promotion rules
- `collection-table-backend-integration-contract.md`: backend handoff contract for the current collection-table proving surface, including required endpoint surfaces and payload shapes
- `collection-table-shared-readiness-plan.md`: execution plan for first real backend hookup and the later promotion of the collection table into a shared module
- `admin-module-registry-backend-handoff.md`: current backend handoff for admin navigation, module registry, and the approved non-root rollout slice
- `app-surfaces.md`: app responsibilities and naming decisions
- `tenant-model.md`: tenant runtime model and cross-app tenant concerns
- `auth-runtime-followups.md`: tracked follow-up work for auth runtime bootstrap, profile gating, and later integration cleanup
- `offline-strategy.md`: when offline stays inside `tenant-web` and when it becomes its own surface
- `foundation-rollout-plan.md`: closed rollout document for the foundation baseline and current rollout status
- `layout-baseline.md`: lightweight layout and grid contract for stable width behavior without a heavy framework grid system
- `install-helper-runtime.md`: current install/access layer contract built on `packages/install-helper`
- `platform-studio/taxonomy-and-naming.md`: canonical Platform Studio naming matrix and anti-drift rules
- `platform-studio/form-builder-first-contract.md`: locked first Form Builder integration contract before FE/BE parallelization
- `platform-studio/form-builder-accepted-registry.md`: final accepted implementation gate across approved sections, registries, scope rules, view rules, and deferred items
- `platform-studio/form-builder-storage-and-sql-view-contract.md`: canonical storage naming, SQL view generation, lookup outputs, and builder-facing backend draft
- `platform-studio/form-builder-backend-scope-payload-contract.md`: canonical backend payload shape for `ps_model`, `ps_view`, `rootScope`, `subformScopes`, storage tables, data views, grid views, and lookup outputs
- `platform-studio/form-builder-backend-api-contract.md`: canonical backend lifecycle contract for `loadBuilderDraft`, `saveBuilderDraft`, `publishBuilderDraft`, publish state, and generated artifact reconciliation
- `platform-studio/form-builder-backend-validation-matrix.md`: canonical validation split for `saveBuilderDraft` vs `publishBuilderDraft`, including lock, scope, binding, storage, and SQL-view enforcement
- `platform-studio/form-builder-backend-object-generation-matrix.md`: canonical publish-time generation matrix for managed vs external-locked models, root and subform scopes, grid SQL views, and lookup outputs
- `platform-studio/form-builder-backend-migration-policy.md`: canonical publish-time migration policy covering additive-safe changes, rejected destructive changes, and future explicit migration mode
- `platform-studio/form-builder-backend-first-slice-handoff.md`: short execution handoff for the first backend implementation slice covering `ps_model`, `ps_view`, load/save/publish, validation, generation, and migration limits
- `platform-studio/form-builder-backend-technical-task-list.md`: technical backend work breakdown by layer for schema, repository, draft API, publish, SQL view generation, and validation
- `platform-studio/form-builder-field-catalog.md`: canonical field, layout, and preset catalog for Form Builder
- `platform-studio/form-builder-section-tree.md`: full review tree of all builder sections and items with short functional descriptions and review status
- `platform-studio/form-builder-core-data-fields.md`: canonical core-field matrix with functionality, model settings, runtime presets, and filter expectations
- `platform-studio/form-builder-choice-fields.md`: canonical choice-field matrix including option-management capabilities for `Single select` and `Multi select`
- `platform-studio/form-builder-multivalue-storage-contract.md`: canonical multivalue storage direction for `Multi select`, `Tags`, and future lookup multiselect with report-friendly bridge-table storage
- `platform-studio/form-builder-choice-preset-inspector-schema.md`: exact model-side inspector schema for `Radio group` and `Checkbox group` presets
- `platform-studio/form-builder-advanced-fields.md`: canonical section-level contract for `Advanced fields` as a reserved extension area with deferred item approval
- `platform-studio/form-builder-content-nodes.md`: canonical static content-node contract for `Heading`, `Text block`, and `Rich text block`
- `platform-studio/form-builder-field-rules-contract.md`: canonical conditional-rule contract for node-level `Visibility rules` and `Requirement rules` within the current scope
- `platform-studio/form-builder-grid-columns-contract.md`: canonical `Grid` tab contract for selecting which fields appear in a grid and in what order
- `platform-studio/form-builder-ready-made-fields.md`: canonical preset contract for `Email`, `Phone`, `URL`, `Tags`, `Date today`, `Radio group`, and `Checkbox group`
- `platform-studio/form-builder-relationships.md`: current relationship-field contract covering `DB lookup`, lookup presets, widget modes, and checklist composition notes
- `platform-studio/form-builder-schema-scope-contract.md`: canonical scope contract for root form schema versus subform schema, including `Section` root-only placement
- `platform-studio/form-builder-subform-checklist-contract.md`: canonical checklist-subform contract for `Lookup Field`, `Result Field`, child-table behavior, and palette-shortcut normalization
- `platform-studio/form-builder-system-fields.md`: canonical contract for `Reported By`, `Reported Date`, and `Status` as palette-level semantic fields
- `platform-studio/form-builder-view-settings-contract.md`: canonical root-view settings contract for icon, corrective action, actions, sorting, page filters, and quick filters
- `platform-studio/form-builder-view-settings-inspector-contract.md`: canonical target inspector UX for root View settings, including sections, compact list rows, and modal filter flows
- `platform-studio/form-builder-v2-field-contract.md`: canonical separation of base field types, presets, System Fields, page settings, and filter definitions
- `platform-studio/form-builder-slice-1-inspector-and-view-schema.md`: canonical slice-1 inspector structure and exact JSON schema for `systemFields` and `filterDefinitions`
- `platform-studio/form-builder-page-and-filter-notes.md`: supporting notes for legacy EzData Page settings and filter surfaces that should stay separate from the field palette
- `platform-studio/form-builder-backend-execution-plan.md`: short staged execution plan tying `Contract Lock`, `Frontend Refactor`, `Backend Draft API`, and `Publish Slice` to the locked Form Builder backend contract
- `platform-studio/form-builder-implementation-backlog.md`: ordered execution backlog for library, inspector, grid tab, rules, and scope-aware storage in the current frontend codebase
- `platform-studio/form-builder-approved-frontend-workstream-plan.md`: current approved frontend execution plan for multivalue storage, lookup derived outputs, DB lookup UX, subform child-view settings, filters, and remaining field-by-field completion
- `phase-e-gap-review.md`: closed-cycle gap review for shared-layer expansion after the first full approval pass
- `deferred-composed-surfaces.md`: backlog and boundary rules for larger workflow-shaped surfaces that should be revisited after the main interface baseline
- `ui-lab-structure.md`: exact `UI Lab` section structure, purpose, and promotion boundary
- `ui-lab-ui-kit-coverage.md`: current `ui-kit` inventory mapped to the canonical `UI Lab` sections
- `ui-kit-boundary-audit.md`: what stays in `ui-kit`, what is provisional, and what stays in app code
- `ui-kit-stable-approved-audit.md`: current snapshot of which `ui-kit` primitives are already approved as stable shared contracts

## Vendor Donor Material

- `vendor/README.md`: vendor-doc index
- `vendor/metronic-inventory.md`: inventory and extraction decisions for Metronic donor sources
- `metronic/`

`metronic/` stays in the repository as donor reference material. Do not treat it as runtime source of truth.

## UI Lab Implementation

- runtime route: `/root/ui-lab`
- implementation module: `apps/platform-admin-web/src/internal/ui-lab`
- route wiring: `apps/platform-admin-web/src/app/app.tsx`

## Platform Studio Builder Workstreams

- `platform-studio/form-builder-approved-frontend-workstream-plan.md`: active frontend execution order for the current Form Builder pass
- `platform-studio/form-builder-rich-text-editor-workstream-contract.md`: approved `Rich text` editor foundation and `ui-kit` / `ui-lab` scope
