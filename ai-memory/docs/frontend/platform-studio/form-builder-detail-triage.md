# Form Builder Detail Triage

Status: active local triage map
Last compacted: 2026-04-25

Scope:

- `platform/frontend/docs/platform-studio/*.md`
- Form Builder detail/workstream docs under the old Platform Studio docs folder
- donor/reference trees under `platform/frontend/docs/platform-studio/**`

This file decides how AI agents should treat old Form Builder detail and workstream docs after the compact tracked docs landed.
Archive and future workstream files listed below have been physically rewritten as short pointer stubs.
Exact-detail reference files remain intact for payload/settings audit.
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

- `compatibility_pointer`: old path kept for links only; read the replacement active doc instead.
- `exact_detail_reference`: precise payload/settings/history detail; read only after the compact doc is insufficient.
- `future_proposal`: open or deferred work; rewrite as proposal before implementation.
- `archive_candidate`: historical workstream, prompt, draft, or closed plan; do not use as current truth.
- `reference_only`: donor/source/reference material; opt-in only and not product truth.

## Compatibility Pointers

These old docs are superseded by active tracked contracts or backend contracts.
Do not read them by default.

| Source | Replacement | Reason |
| --- | --- | --- |
| `platform/frontend/docs/platform-studio/README.md` | `platform/frontend/docs/modules/platform-studio/README.md` | Suite entrypoint moved. |
| `platform/frontend/docs/platform-studio/taxonomy-and-naming.md` | `platform/frontend/docs/contracts/platform-studio.md` | Suite taxonomy and tool ownership moved. |
| `platform/frontend/docs/platform-studio/form-builder-first-contract.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | First Form Builder contract compacted. |
| `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Three-schema rules compacted. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-naming-contract-v1-1.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Runtime naming compacted. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-view-strategy-v1.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Per-view runtime strategy compacted. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-routes-contract-v1.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Runtime route model compacted. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-access-and-entry-context-v1.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Runtime/preview access staging compacted. |
| `platform/frontend/docs/platform-studio/form-builder-package-boundary-plan-v1.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Package boundary rules compacted. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Static/external model behavior compacted. |
| `platform/frontend/docs/platform-studio/form-builder-import-bundle-contract-v1.md` | `platform/frontend/docs/modules/platform-studio/form-builder.md` | Managed export/import direction compacted. |
| `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Backend boundary moved to backend contract. |
| `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Backend API truth moved to backend contract. |
| `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Backend payload truth moved to backend contract. |
| `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Storage/SQL view truth moved to backend contract. |
| `platform/frontend/docs/platform-studio/form-builder-backend-validation-matrix.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Backend validation truth moved to backend contract. |
| `platform/frontend/docs/platform-studio/form-builder-backend-object-generation-matrix.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Runtime apply/generated object truth moved to backend contract. |
| `platform/frontend/docs/platform-studio/form-builder-backend-migration-policy.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Additive migration policy moved to backend contract. |
| `platform/frontend/docs/platform-studio/form-builder-backend-first-slice-handoff.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Backend handoff compacted; old publish wording superseded. |
| `platform/frontend/docs/platform-studio/form-builder-backend-technical-task-list.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Durable backend task facts compacted. |
| `platform/frontend/docs/platform-studio/form-builder-backend-execution-plan.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Backend execution sequencing compacted where still durable. |
| `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md` | `platform/backend/docs/contracts/platform-studio-form-builder.md` | Runtime storage review compacted. |

## Exact Detail References

These docs may still be useful for exact settings or historical payload details.
Their tracked headers declare `Status: exact detail reference`.
Read the compact supporting contract first:

- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

| Source | Read Only When | Replacement Summary |
| --- | --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md` | Need exact accepted registry/palette gate. | Compacted into `form-builder-fields.md`. |
| `platform/frontend/docs/platform-studio/form-builder-v2-field-contract.md` | Need exact field registry or persisted-shape examples. | Compacted into `form-builder-fields.md`. |
| `platform/frontend/docs/platform-studio/form-builder-field-catalog.md` | Need full catalog/historical legacy mapping. | Compacted into `form-builder-fields.md`; expensive read. |
| `platform/frontend/docs/platform-studio/form-builder-core-data-fields.md` | Need exact basic-field settings. | Basic base types compacted. |
| `platform/frontend/docs/platform-studio/form-builder-choice-fields.md` | Need exact choice-field settings. | Choice fields compacted. |
| `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md` | Need exact radio/checkbox inspector schema. | Choice preset rules compacted. |
| `platform/frontend/docs/platform-studio/form-builder-ready-made-fields.md` | Need exact ready-made preset settings. | Ready-made presets compacted. |
| `platform/frontend/docs/platform-studio/form-builder-relationships.md` | Need exact lookup/relationship settings. | Relationship presets compacted; backend lookup support still requires code/backend contract verification. |
| `platform/frontend/docs/platform-studio/form-builder-advanced-fields.md` | Need exact deferred advanced item rationale. | Advanced section compacted as reserved/deferred. |
| `platform/frontend/docs/platform-studio/form-builder-content-nodes.md` | Need exact content-node settings. | Content nodes compacted. |
| `platform/frontend/docs/platform-studio/form-builder-system-fields.md` | Need exact System Field payload/settings. | System Fields compacted. |
| `platform/frontend/docs/platform-studio/form-builder-section-tree.md` | Need full palette review tree. | Layout/content/tree facts compacted. |
| `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md` | Need exact inspector/view schema examples. | Durable facts compacted. |
| `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md` | Need exact root/subform scope details. | Scope rules compacted. |
| `platform/frontend/docs/platform-studio/form-builder-subform-checklist-contract.md` | Need exact checklist subform settings. | Checklist rules compacted. |
| `platform/frontend/docs/platform-studio/form-builder-field-rules-contract.md` | Need exact rule payload shape. | Simple rules compacted; Action Builder side effects excluded. |
| `platform/frontend/docs/platform-studio/form-builder-grid-columns-contract.md` | Need exact grid-column payload shape. | Grid rules compacted. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md` | Need exact filter/view settings payload shape. | View settings and filters compacted. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md` | Need exact inspector UX details. | Inspector detail compacted. |
| `platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md` | Need exact `suggest_text` settings. | `suggest_text` compacted as ready-made preset. |
| `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md` | Need exact static lookup naming examples. | Static/external model rules compacted in main Form Builder contract; exact naming remains detailed reference. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md` | Need exact static table list/treatment. | Static/external model rules compacted in main Form Builder contract. |
| `platform/frontend/docs/platform-studio/data-schema-storage-rules.md` | Need old logical-vs-physical storage rationale. | Prefer backend Form Builder contract for current storage truth. |

## Future Proposals

These docs contain open/deferred work.
Do not implement directly from them.
Rewrite the relevant parts into a proposal before work starts.
Their tracked paths are now short future proposal pointer stubs.

| Source | Future Target | Reason |
| --- | --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-implementation-backlog.md` | `platform/frontend/docs/proposals/platform-studio-form-builder-backlog.md` | Contains broad implementation backlog, mixed landed/open state. |
| `platform/frontend/docs/platform-studio/form-builder-multivalue-storage-contract.md` | backend/frontend proposal or backend contract addendum | Storage direction is backend-facing and still needs final implementation/code verification. |
| `platform/frontend/docs/platform-studio/form-builder-schema-cleanup-contract-v1.md` | compatibility cleanup proposal | Payload cleanup is useful, but should not override current code/contracts without an implementation slice. |
| `platform/frontend/docs/platform-studio/form-builder-rich-text-editor-workstream-contract.md` | rich text proposal only if work is reactivated | Workstream language should not stay hot; durable field/content distinction is already compacted. |

## Archive Candidates

These are historical workstreams, prompts, task prompts, drafts, or closed plans.
They should not be used as current truth.
Their tracked paths are now short archive pointer stubs.

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
| `platform/frontend/docs/platform-studio/EXTDB/**` | `reference-pack:extdb-legacy`; legacy product source/reference for old field ids, page settings, templates, filters, import/PDF/report behaviors. |
| `platform/frontend/docs/platform-studio/ezform/**` | `reference-pack:ezform-prototype`; donor authoring-shell reference. |
| `platform/frontend/docs/platform-studio/smartapp/**` | `reference-pack:smartapp-runtime`; donor/runtime reference for old field rendering and runtime behavior. |
| `platform/frontend/docs/platform-studio/old-code-reference/**` | `reference-pack:old-builder-reference`; historical old builder code reference. |
| `platform/frontend/docs/platform-studio/ezform-analysis.md` | Donor analysis; durable lessons should be compacted before implementation. |

Alias registry:

- `docs/ref/reference-code.md`

## Read Rules

- If a doc has `Status: active` but appears in this triage as `exact_detail_reference`, do not treat its status as default read priority.
- If a doc is `future_proposal`, verify owner activation before implementation; the old tracked path is a pointer stub.
- If a doc is `archive_candidate`, use git history only when exact historical content is needed; the old tracked path is a pointer stub.
- If a task needs donor/source behavior, read only the exact reference file needed and distill the lesson into active docs or memory.
- Prefer `reference-pack:*` citations over raw donor paths when rewriting old docs.
