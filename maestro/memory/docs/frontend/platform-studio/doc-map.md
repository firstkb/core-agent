# Platform Studio Source Doc Classification

Status: compact classification
Last compacted: 2026-04-25

Scope:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/platform-studio/**`

This classification optimizes retrieval.
Most source docs keep their tracked paths until the owner explicitly approves a tracked docs reorg.
Archive and future Form Builder workstream pointer stubs were deleted after
compaction.
Old suite-level and backend-facing compatibility pointer stubs were deleted after
backend facts moved to the active backend contract.

For the full old Form Builder detail/workstream classification, read:

- `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`

## Classification Labels

- `hot_entrypoint`: read early for suite-level Platform Studio work.
- `hot_contract`: read early for Form Builder work.
- `active_detail_contract`: current but only needed for a specific feature area.
- `supporting_contract`: useful implementation detail, not the first read.
- `working_plan`: active or partially implemented plan; verify against code before treating as landed.
- `operational_scaffold`: prompt, handoff, task, or execution helper; not product truth.
- `reference_only`: donor, old code, analysis, or historical material; opt-in only.
- `archive_candidate`: should leave active docs after tracked-doc reorg or after durable outcomes are compacted.

## Active Tracked Entrypoints

Read these before opening detailed Platform Studio/Form Builder source docs.

| Source | Classification | Why |
| --- | --- | --- |
| `platform/frontend/docs/contracts/platform-studio.md` | `hot_entrypoint` | Current suite boundary, tool ownership, naming, route language, and tenant-web/shared package split. |
| `platform/frontend/docs/modules/platform-studio/README.md` | `hot_entrypoint` | Current tracked module entrypoint and read order for suite-level Platform Studio work. |
| `platform/frontend/docs/modules/platform-studio/form-builder.md` | `hot_contract` | Current active Form Builder authoring/runtime contract. |
| `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` | `supporting_contract` | Current compact field catalog, palette registry, rules, grid/view settings, and scope boundary contract. Read after the main Form Builder contract. |
| `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md` | `local_triage_map` | Local classification for old Form Builder docs into compatibility pointer, exact detail, future proposal, archive candidate, and reference-only. |
| `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md` | `local_consolidation_audit` | Retention/deletion decisions for the remaining exact-detail docs. |
| `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md` | `local_planned_work_map` | Code-read separation of implemented Form Builder behavior from planned/open work such as import, runtime grants, preview guards, non-lookup multivalue storage, and runtime package extraction. |

## Deleted Compatibility Inputs

Old suite-level, taxonomy, hot Form Builder contract, and frontend-owned
backend-facing pointer files were deleted after compaction. Use the active
suite/Form Builder/backend contracts or git history for exact old text.

## Field/Catalog Supporting Details

Read `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` first.
Open these old detailed docs only when the compact supporting contract is not enough for exact payload or historical audit detail.
These retained docs now declare `Status: exact detail reference` in their tracked headers.
They are policy-kept opt-in references until code-backed docs, typed schemas,
tests, or generated registries replace their exact payload examples.

| Source | Feature Area |
| --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md` | Exact palette and accepted registry gate detail. |
| `platform/frontend/docs/platform-studio/form-builder-v2-field-contract.md` | Exact field contract detail. |
| `platform/frontend/docs/platform-studio/form-builder-field-catalog.md` | Full catalog detail; expensive read. Prefer the compact supporting contract. |
| `platform/frontend/docs/platform-studio/form-builder-core-data-fields.md` | Basic field behavior. |
| `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md` | Choice preset inspector shape. |
| `platform/frontend/docs/platform-studio/form-builder-relationships.md` | Relationship and lookup fields. |
| `platform/frontend/docs/platform-studio/form-builder-system-fields.md` | System Fields. |
| `platform/frontend/docs/platform-studio/form-builder-section-tree.md` | Section tree and layout hierarchy. |
| `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md` | Slice 1 inspector and view schema baseline. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md` | View settings. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md` | View settings inspector. |
| `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md` | Static lookup naming. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md` | Static model integration direction. |

Deleted after extraction: advanced fields, content nodes, checklist subform, field rules, and grid columns were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
Deleted after preset extraction: choice fields, ready-made fields, and `suggest_text` were compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
Deleted after scope extraction: schema scope was compacted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.

## Backend-Facing Supporting Contracts

Backend-owned Form Builder truth now lives in `platform/backend/docs/contracts/platform-studio-form-builder.md`.
Backend implementation orientation now lives in `platform/backend/docs/modules/platform-studio/form-builder.md`.

| Source | Role |
| --- | --- |
| `platform/backend/docs/contracts/platform-studio-form-builder.md` | Active backend Form Builder API/storage/runtime apply contract. |
| `platform/backend/docs/modules/platform-studio/form-builder.md` | Active backend Form Builder implementation map and read order. |

## Deleted Working Plans And Future Proposals

Old future/archive pointer stubs for Form Builder backlog, multivalue storage,
schema cleanup, rich text, approved workstream, static-model execution/migration
drafts, and static-model task prompts were deleted after compaction.

Future work must be rewritten as a fresh proposal from active docs and verified
against code before implementation. Use git history only for exact old text.

## Foundation And Supporting Notes

These are not first-read docs after the compact memory layer exists.

| Source | Handling |
| --- | --- |
| `platform/frontend/docs/platform-studio/data-schema-storage-rules.md` | Supporting storage rules; use when storage detail is needed. |
| `platform/frontend/docs/platform-studio/ezform-analysis.md` | Reference analysis only. |

## Operational Scaffolds And Archive Candidates

Old prompt/task pointer stubs were deleted after compaction.
Use git history only for exact old prompt text.

| Source | Classification | Reason |
| --- | --- | --- |
| `reference-pack:old-builder-reference` | `reference_only` | Historical opt-in code reference under local `reference-code/platform-studio/old-builder-reference/`. |
| `reference-pack:extdb-legacy` | `reference_only` | Legacy behavior source under local `reference-code/platform-studio/extdb/`. |
| `reference-pack:ezform-prototype` | `reference_only` | Donor/reference project material under local `reference-code/platform-studio/ezform/`. |
| `reference-pack:smartapp-runtime` | `reference_only` | Donor/reference project material under local `reference-code/platform-studio/smartapp/`. |

Reference-code alias registry:

- `maestro/memory/reference-code/README.md`

## Proposed Active Footprint After Tracked Docs Reorg

If the owner later approves a physical tracked-doc reorg, keep active Platform Studio docs close to this shape:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

Everything else should be under a clear `supporting/`, `working/`, `reference/`, or `archive/` folder, or compacted into module memory.
