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
Archive and future Form Builder workstream files have been rewritten in place as short pointer stubs.

For the full old Form Builder detail/workstream classification, read:

- `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md`

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
| `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md` | `local_triage_map` | Local classification for old Form Builder docs into compatibility pointer, exact detail, future proposal, archive candidate, and reference-only. |

## Compatibility Pointers

These old suite-level and Form Builder paths should not be used as active entrypoints.

| Source | Classification | Why |
| --- | --- | --- |
| `platform/frontend/docs/platform-studio/README.md` | `compatibility_pointer` | Compacted into the new suite contract and module entrypoint. |
| `platform/frontend/docs/platform-studio/taxonomy-and-naming.md` | `compatibility_pointer` | Compacted into the new suite contract. |
| `platform/frontend/docs/platform-studio/form-builder-first-contract.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-naming-contract-v1-1.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-view-strategy-v1.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-routes-contract-v1.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-access-and-entry-context-v1.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-package-boundary-plan-v1.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-import-bundle-contract-v1.md` | `compatibility_pointer` | Compacted into the active Form Builder module contract. |
| `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md` | `compatibility_pointer` | Backend-owned facts compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md` | `compatibility_pointer` | Backend-owned facts compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md` | `compatibility_pointer` | Backend-owned facts compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md` | `compatibility_pointer` | Backend-owned facts compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-backend-validation-matrix.md` | `compatibility_pointer` | Backend-owned facts compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-backend-object-generation-matrix.md` | `compatibility_pointer` | Backend-owned facts compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-backend-migration-policy.md` | `compatibility_pointer` | Backend-owned facts compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md` | `compatibility_pointer` | Backend execution sequencing compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md` where still durable. |
| `platform/frontend/docs/platform-studio/form-builder-backend-first-slice-handoff.md` | `compatibility_pointer` | Backend handoff compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`; old publish lifecycle wording is superseded. |
| `platform/frontend/docs/platform-studio/form-builder-backend-technical-task-list.md` | `compatibility_pointer` | Backend task list compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md` | `compatibility_pointer` | Runtime storage review compacted into `platform/backend/docs/contracts/platform-studio-form-builder.md`. |

## Field/Catalog Supporting Details

Read `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` first.
Open these old detailed docs only when the compact supporting contract is not enough for exact payload or historical audit detail.

| Source | Feature Area |
| --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md` | Exact palette and accepted registry gate detail. |
| `platform/frontend/docs/platform-studio/form-builder-v2-field-contract.md` | Exact field contract detail. |
| `platform/frontend/docs/platform-studio/form-builder-field-catalog.md` | Full catalog detail; expensive read. Prefer the compact supporting contract. |
| `platform/frontend/docs/platform-studio/form-builder-core-data-fields.md` | Basic field behavior. |
| `platform/frontend/docs/platform-studio/form-builder-choice-fields.md` | Choice fields. |
| `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md` | Choice preset inspector shape. |
| `platform/frontend/docs/platform-studio/form-builder-ready-made-fields.md` | Ready-made field presets. |
| `platform/frontend/docs/platform-studio/form-builder-relationships.md` | Relationship and lookup fields. |
| `platform/frontend/docs/platform-studio/form-builder-advanced-fields.md` | Reserved advanced field section. |
| `platform/frontend/docs/platform-studio/form-builder-content-nodes.md` | Content nodes. |
| `platform/frontend/docs/platform-studio/form-builder-system-fields.md` | System Fields. |
| `platform/frontend/docs/platform-studio/form-builder-section-tree.md` | Section tree and layout hierarchy. |
| `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md` | Slice 1 inspector and view schema baseline. |
| `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md` | Root/subform scope contract. |
| `platform/frontend/docs/platform-studio/form-builder-subform-checklist-contract.md` | Checklist subform behavior. |
| `platform/frontend/docs/platform-studio/form-builder-field-rules-contract.md` | Field rule payloads. |
| `platform/frontend/docs/platform-studio/form-builder-grid-columns-contract.md` | Grid/list columns. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md` | View settings. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md` | View settings inspector. |
| `platform/frontend/docs/platform-studio/form-builder-multivalue-storage-contract.md` | Multivalue storage. |
| `platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md` | `suggest_text` field contract. |
| `platform/frontend/docs/platform-studio/form-builder-rich-text-editor-workstream-contract.md` | Rich text editor slice. |
| `platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md` | Schema cleanup and compatibility. |
| `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md` | Static lookup naming. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md` | Static model integration direction. |

## Backend-Facing Supporting Contracts

Backend-owned Form Builder truth now lives in `platform/backend/docs/contracts/platform-studio-form-builder.md`.
Backend implementation orientation now lives in `platform/backend/docs/modules/platform-studio/form-builder.md`.

| Source | Role |
| --- | --- |
| `platform/backend/docs/contracts/platform-studio-form-builder.md` | Active backend Form Builder API/storage/runtime apply contract. |
| `platform/backend/docs/modules/platform-studio/form-builder.md` | Active backend Form Builder implementation map and read order. |

## Working Plans And Future Proposals

These are useful for sequencing or historical context but should not override contracts or code.
Use the detail triage map before opening them.
The listed future proposal files are pointer stubs; use git history only for exact historical content.

| Source | Current Handling |
| --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-implementation-backlog.md` | `future_proposal`; rewrite before implementation. |
| `platform/frontend/docs/platform-studio/form-builder-multivalue-storage-contract.md` | `future_proposal`; backend-facing storage direction needs implementation/code verification. |
| `platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md` | `future_proposal`; compatibility cleanup proposal, not current contract. |
| `platform/frontend/docs/platform-studio/form-builder-approved-frontend-workstream-plan.md` | `archive_candidate`; durable outcomes compacted. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-execution-plan-v1.md` | `archive_candidate`; execution history. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-migration-draft-v1.md` | `archive_candidate`; draft detail. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-phase-1-reference-schema-pack-v1.md` | `archive_candidate`; reference draft. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-users-field-map-draft-v1.md` | `archive_candidate`; draft detail. |

## Foundation And Supporting Notes

These are not first-read docs after the compact memory layer exists.

| Source | Handling |
| --- | --- |
| `platform/frontend/docs/platform-studio/v2-foundation-brief.md` | Supporting foundation; compacted outcomes live in module memory. |
| `platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md` | Supporting technical map. |
| `platform/frontend/docs/platform-studio/data-schema-storage-rules.md` | Supporting storage rules; use when storage detail is needed. |
| `platform/frontend/docs/platform-studio/form-builder-page-and-filter-notes.md` | Notes; prefer current view settings/runtime filter contracts. |
| `platform/frontend/docs/platform-studio/ezform-analysis.md` | Reference analysis only. |

## Operational Scaffolds And Archive Candidates

These should not be active truth.
The listed prompt/task artifacts are pointer stubs; use git history only for exact historical content.

| Source | Classification | Reason |
| --- | --- | --- |
| `platform/frontend/docs/platform-studio/agent-prompts.md` | `operational_scaffold` / `archive_candidate` | Prompt artifact. |
| `platform/frontend/docs/platform-studio/promt-continue.md` | `operational_scaffold` / `archive_candidate` | Prompt artifact. |
| `platform/frontend/docs/platform-studio/promt-continue-short.md` | `operational_scaffold` / `archive_candidate` | Prompt artifact. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-atlas-task-v1.md` | `operational_scaffold` / `archive_candidate` | Task prompt, not product truth. |
| `platform/frontend/docs/platform-studio/old-code-reference/**` | `reference_only` | `reference-pack:old-builder-reference`; historical opt-in code reference. |
| `platform/frontend/docs/platform-studio/EXTDB/**` | `reference_only` | `reference-pack:extdb-legacy`; legacy behavior source. |
| `platform/frontend/docs/platform-studio/ezform/**` | `reference_only` | `reference-pack:ezform-prototype`; donor/reference project material. |
| `platform/frontend/docs/platform-studio/smartapp/**` | `reference_only` | `reference-pack:smartapp-runtime`; donor/reference project material. |

Reference-code alias registry:

- `docs/ref/reference-code.md`

## Proposed Active Footprint After Tracked Docs Reorg

If the owner later approves a physical tracked-doc reorg, keep active Platform Studio docs close to this shape:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

Everything else should be under a clear `supporting/`, `working/`, `reference/`, or `archive/` folder, or compacted into module memory.
