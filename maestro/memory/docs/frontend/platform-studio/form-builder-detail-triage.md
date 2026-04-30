# Form Builder Detail Triage

Status: active local triage map
Last compacted: 2026-04-25

Scope:

- `platform/frontend/docs/platform-studio/*.md`
- Form Builder detail/workstream docs under the old Platform Studio docs folder
- donor/reference trees under `platform/frontend/docs/platform-studio/**`

This file decides how AI agents should treat old Form Builder detail and workstream docs after the compact tracked docs landed.
Archive and future workstream pointer stubs listed below were deleted after
durable facts were compacted.
Retained exact-detail reference files remain for payload/settings audit.
Retained exact-detail reference files now declare `Status: exact detail reference` in their tracked headers.

## Active Read Path

Read in this order before opening any old Form Builder detail doc:

1. `platform/frontend/docs/contracts/platform-studio.md`
2. `platform/frontend/docs/modules/platform-studio/README.md`
3. `platform/frontend/docs/modules/platform-studio/form-builder.md`
4. `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
5. `platform/backend/docs/contracts/platform-studio-form-builder.md` when backend/API/storage/runtime apply is involved
6. `platform/backend/docs/modules/platform-studio/form-builder.md` when backend implementation orientation is needed

## Triage Roles

- `deleted_compatibility_pointer`: old pointer path was deleted after durable facts moved to the replacement active doc.
- `exact_detail_reference`: precise payload/settings/history detail; read only after the compact doc is insufficient.
- `future_proposal`: open or deferred work; rewrite as proposal before implementation.
- `archive_candidate`: historical workstream, prompt, draft, or closed plan; do not use as current truth.
- `reference_only`: donor/source/reference material; opt-in only and not product truth.

## Deleted Compatibility Pointers

Old suite-level, taxonomy, hot Form Builder contract, and frontend-owned
backend-facing pointer files were deleted after compaction. Read the active
replacement docs first and use git history only for exact old text:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

## Exact Detail References

These docs may still be useful for exact settings or historical payload details.
Their tracked headers declare `Status: exact detail reference`.
Read the compact supporting contract first:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

For consolidation decisions, deletion blockers, and extraction targets, read:

- `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`

Retention policy:

- retained exact-detail docs are opt-in payload references, not active ownership docs
- do not delete them just to reduce file count
- replace them only after code-backed docs, typed schemas, tests, or generated registries cover the same details
- keep deleted exact-detail paths as git-history provenance only

| Source | Read Only When | Replacement Summary |
| --- | --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md` | Need exact accepted registry/palette gate. | Compacted into `form-builder-fields.md`. |
| `platform/frontend/docs/platform-studio/form-builder-v2-field-contract.md` | Need exact field registry or persisted-shape examples. | Compacted into `form-builder-fields.md`. |
| `platform/frontend/docs/platform-studio/form-builder-field-catalog.md` | Need full catalog/historical legacy mapping. | Compacted into `form-builder-fields.md`; expensive read. |
| `platform/frontend/docs/platform-studio/form-builder-core-data-fields.md` | Need exact basic-field settings. | Basic base types compacted. |
| `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md` | Need exact radio/checkbox inspector schema. | Choice preset rules compacted. |
| `platform/frontend/docs/platform-studio/form-builder-relationships.md` | Need exact lookup/relationship settings. | Relationship presets compacted; backend lookup support still requires code/backend contract verification. |
| `platform/frontend/docs/platform-studio/form-builder-system-fields.md` | Need exact System Field payload/settings. | System Fields compacted. |
| `platform/frontend/docs/platform-studio/form-builder-section-tree.md` | Need full palette review tree. | Layout/content/tree facts compacted. |
| `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md` | Need exact inspector/view schema examples. | Durable facts compacted. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md` | Need exact filter/view settings payload shape. | View settings and filters compacted. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md` | Need exact inspector UX details. | Inspector detail compacted. |
| `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md` | Need exact static lookup naming examples. | Static/external model rules compacted in main Form Builder contract; exact naming remains detailed reference. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md` | Need exact static table list/treatment. | Static/external model rules compacted in main Form Builder contract. |
| `platform/frontend/docs/platform-studio/data-schema-storage-rules.md` | Need old logical-vs-physical storage rationale. | Prefer backend Form Builder contract for current storage truth. |

## Deleted Exact-Detail Sources After Extraction

These files were payload-bearing, then compacted into
`platform/frontend/docs/modules/platform-studio/form-builder-fields.md` and
deleted. Use git history only for exact old text.

| Source | Extracted Into |
| --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-advanced-fields.md` | Advanced section acceptance boundary and deferred backlog. |
| `platform/frontend/docs/platform-studio/form-builder-content-nodes.md` | Content node settings, compile targets, and rejected content nodes. |
| `platform/frontend/docs/platform-studio/form-builder-field-rules-contract.md` | Rule operators, persisted rule shape, authoring rules, and runtime rules. |
| `platform/frontend/docs/platform-studio/form-builder-grid-columns-contract.md` | Grid column shape, editor rules, and runtime/default-hidden behavior. |
| `platform/frontend/docs/platform-studio/form-builder-subform-checklist-contract.md` | Checklist bindings, normalization, optional sibling fields, and deferred setup details. |
| `platform/frontend/docs/platform-studio/form-builder-choice-fields.md` | Choice field source/settings matrix and option authoring rules. |
| `platform/frontend/docs/platform-studio/form-builder-ready-made-fields.md` | Ready-made preset compile targets and locked settings matrix. |
| `platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md` | `suggest_text` storage, config, runtime, backend boundary, and filter behavior. |
| `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md` | Builder document shape, root/subform scope ownership, Section placement, and subform runtime boundary. |

## Deleted Future Proposal Pointers

These old docs contained open/deferred work but were pointer-only after
compaction. Do not implement directly from them. Rewrite the relevant parts into
a fresh proposal before work starts, and use git history only for exact old text.

| Source | Future Target | Reason |
| --- | --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-implementation-backlog.md` | `platform/frontend/docs/proposals/platform-studio-form-builder-backlog.md` | Contains broad implementation backlog, mixed landed/open state. |
| `platform/frontend/docs/platform-studio/form-builder-multivalue-storage-contract.md` | backend/frontend proposal or backend contract addendum | Storage direction is backend-facing and still needs final implementation/code verification. |
| `platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md` | compatibility cleanup proposal | Payload cleanup is useful, but should not override current code/contracts without an implementation slice. |
| `platform/frontend/docs/platform-studio/form-builder-rich-text-editor-workstream-contract.md` | rich text proposal only if work is reactivated | Workstream language should not stay hot; durable field/content distinction is already compacted. |

## Deleted Archive Pointers

These historical workstreams, prompts, task prompts, drafts, or closed plans
were pointer-only after compaction and were deleted. They should not be used as
current truth. Use git history only for exact old text.

| Source | Reason |
| --- | --- |
| `platform/frontend/docs/platform-studio/agent-prompts.md` | Prompt artifact. |
| `platform/frontend/docs/platform-studio/promt-continue.md` | Prompt artifact. |
| `platform/frontend/docs/platform-studio/promt-continue-short.md` | Prompt artifact. |
| `platform/frontend/docs/platform-studio/form-builder-approved-frontend-workstream-plan.md` | Workstream history; durable field/view facts compacted. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-atlas-task-v1.md` | Agent task prompt. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-execution-plan-v1.md` | Execution history; verify code before using any remaining task. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-migration-draft-v1.md` | Draft migration detail; not canonical. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-phase-1-reference-schema-pack-v1.md` | Reference draft; not active contract. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-users-field-map-draft-v1.md` | Draft field map; not active contract. |
| `platform/frontend/docs/platform-studio/v2-foundation-brief.md` | Foundation history; durable outcomes compacted. |
| `platform/frontend/docs/platform-studio/forms-foundation-a-technical-map.md` | Technical map history; not current source of truth. |
| `platform/frontend/docs/platform-studio/form-builder-page-and-filter-notes.md` | Notes; durable filter/view settings compacted. |

## Reference-Only Donor Material

These are opt-in reference sources.
They are not product truth and should not be read by default.

| Source | Role |
| --- | --- |
| `reference-pack:extdb-legacy` | Legacy product source/reference for old field ids, page settings, templates, filters, import/PDF/report behaviors. |
| `reference-pack:ezform-prototype` | Donor authoring-shell reference. |
| `reference-pack:smartapp-runtime` | Donor/runtime reference for old field rendering and runtime behavior. |
| `reference-pack:old-builder-reference` | Historical old builder code reference. |
| `platform/frontend/docs/platform-studio/ezform-analysis.md` | Donor analysis; durable lessons should be compacted before implementation. |

Alias registry:

- `docs/ref/reference-code.md`

## Read Rules

- If a doc has `Status: active` but appears in this triage as `exact_detail_reference`, do not treat its status as default read priority.
- If a deleted old path is `future_proposal`, verify owner activation before implementation and rewrite it as a fresh proposal.
- If a deleted old path is `archive_candidate`, use git history only when exact historical content is needed.
- If a task needs donor/source behavior, read only the exact reference file needed and distill the lesson into active docs or memory.
- Prefer `reference-pack:*` citations over raw donor paths when rewriting old docs.
