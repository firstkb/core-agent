# Form Builder Exact Detail Consolidation Audit

Status: active consolidation audit
Last audited: 2026-04-25

Scope:

- retained `Status: exact detail reference` docs under `platform/frontend/docs/platform-studio/*.md`
- deleted exact-detail docs that were compacted into `form-builder-fields.md`
- active compact docs:
  - `platform/frontend/docs/modules/platform-studio/form-builder.md`
  - `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
  - `platform/backend/docs/contracts/platform-studio-form-builder.md`

This audit decides which exact-detail docs remain as opt-in payload references,
which still require extraction, and which were deleted after extraction.

## Read Rule

Default Form Builder read path stays:

1. `platform/frontend/docs/contracts/platform-studio.md`
2. `platform/frontend/docs/modules/platform-studio/README.md`
3. `platform/frontend/docs/modules/platform-studio/form-builder.md`
4. `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
5. `platform/backend/docs/contracts/platform-studio-form-builder.md` when backend/API/storage/runtime apply is involved

Open exact-detail docs only when the compact docs are insufficient for payload
shape, inspector behavior, migration/static-model detail, or historical audit.

## Decision Values

- `keep_exact_detail`: keep the file as an opt-in payload/settings reference.
- `compact_more_then_delete`: extract remaining durable facts into active docs, then delete the old file in a later slice.
- `delete_after_payload_extraction`: delete only after the listed extraction target is updated and verified.

Current audit result:

- `keep_exact_detail`: 14
- `compact_more_then_delete`: 1
- `deleted_after_payload_extraction`: 8
- `delete_now_without_extraction`: 0

## Consolidation Decisions

| Source | Lines | Decision | Why | Extraction target before deletion |
| --- | ---: | --- | --- | --- |
| `platform/frontend/docs/platform-studio/form-builder-field-catalog.md` | 1054 | `keep_exact_detail` | Full catalog, legacy mapping, parameter families, and review backlog remain too dense for the compact contract. | Keep until a generated/structured field registry replaces the prose catalog. |
| `platform/frontend/docs/platform-studio/form-builder-core-data-fields.md` | 665 | `keep_exact_detail` | Exact basic-field settings and gaps are still useful for implementation slices. | Keep until field settings are represented in typed schema/tests. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-contract.md` | 683 | `keep_exact_detail` | Exact `viewSettings`, page-filter, quick-filter payload rules and examples are still payload-bearing. | Keep until view settings schemas/tests cover these shapes. |
| `platform/frontend/docs/platform-studio/form-builder-slice-1-inspector-and-view-schema.md` | 682 | `keep_exact_detail` | Exact JSON schema and minimal saved example remain useful for inspector/view-schema work. | Keep until current code/schema owns the same examples. |
| `platform/frontend/docs/platform-studio/form-builder-v2-field-contract.md` | 558 | `keep_exact_detail` | Exact contract-layer and persisted-shape examples remain useful for schema evolution. | Keep until `platform-studio-core` exports stable equivalent schema docs. |
| `platform/frontend/docs/platform-studio/form-builder-section-tree.md` | 514 | `keep_exact_detail` | Full palette review tree is useful for audit and registry drift checks. | Keep until an accepted registry artifact can generate the tree. |
| `platform/frontend/docs/platform-studio/form-builder-static-models-integration-v1.md` | 403 | `keep_exact_detail` | Static/external model treatment and table-by-table notes remain implementation-relevant but not fully active. | Keep until static model implementation is code-confirmed and compacted into active docs. |
| `platform/frontend/docs/platform-studio/form-builder-accepted-registry.md` | 387 | `keep_exact_detail` | Accepted registry is a useful high-signal checklist across palette, scope, rules, grid, and filters. | Keep until active registry source is structured or code-confirmed. |
| `platform/frontend/docs/platform-studio/form-builder-relationships.md` | 363 | `keep_exact_detail` | Lookup presets, display mode, checklist composition, and multi lookup boundaries are not fully covered by compact docs. | Keep until lookup/static model support is code-confirmed. |
| `platform/frontend/docs/platform-studio/form-builder-view-settings-inspector-contract.md` | 335 | `keep_exact_detail` | Exact inspector sections, modal flows, row rendering, and validation are payload-bearing UI detail. | Keep until inspector UI contract is represented in code/tests. |
| `platform/frontend/docs/platform-studio/form-builder-system-fields.md` | 309 | `keep_exact_detail` | System Field binding/storage/legacy translation rules are important and error-prone. | Keep until systemFields schema/tests cover the same rules. |
| `platform/frontend/docs/platform-studio/data-schema-storage-rules.md` | 286 | `keep_exact_detail` | Logical-vs-physical storage rationale and external/static storage boundaries still help backend-facing work. | Keep until backend contract and code fully cover these storage rules. |
| `platform/frontend/docs/platform-studio/form-builder-choice-preset-inspector-schema.md` | 298 | `keep_exact_detail` | Exact radio/checkbox inspector schema and normalized settings are payload-bearing. | Keep until inspector schemas are typed and tested. |
| `platform/frontend/docs/platform-studio/form-builder-static-lookup-naming-policy-v1.md` | 235 | `keep_exact_detail` | Static lookup naming examples prevent raw FK-column leakage into `storageKey`. | Keep until static lookup naming is enforced in code/tests. |
| `platform/frontend/docs/platform-studio/form-builder-choice-fields.md` | 231 | `deleted_after_payload_extraction` | Choice source/settings matrix and option authoring rules were compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |
| `platform/frontend/docs/platform-studio/form-builder-ready-made-fields.md` | 265 | `deleted_after_payload_extraction` | Ready-made preset compile targets and locked settings were compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |
| `platform/frontend/docs/platform-studio/form-builder-suggest-text-field-contract-v1.md` | 216 | `deleted_after_payload_extraction` | `suggest_text` source/runtime/backend/filter behavior was compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |
| `platform/frontend/docs/platform-studio/form-builder-schema-scope-contract.md` | 215 | `compact_more_then_delete` | Scope/root/subform rules are mostly compacted but exact authoring shape remains useful. | Add scope authoring shape to `form-builder-fields.md` and main Form Builder contract if needed. |
| `platform/frontend/docs/platform-studio/form-builder-field-rules-contract.md` | 173 | `deleted_after_payload_extraction` | Rule operators, persisted shape, authoring rules, and runtime rules were compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |
| `platform/frontend/docs/platform-studio/form-builder-content-nodes.md` | 170 | `deleted_after_payload_extraction` | Content node settings, compile targets, and accepted/rejected node boundaries were compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |
| `platform/frontend/docs/platform-studio/form-builder-subform-checklist-contract.md` | 136 | `deleted_after_payload_extraction` | Checklist binding shape, normalization, optional sibling fields, and deferred setup details were compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |
| `platform/frontend/docs/platform-studio/form-builder-grid-columns-contract.md` | 133 | `deleted_after_payload_extraction` | Grid column shape, editor, runtime, and default-hidden rules were compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |
| `platform/frontend/docs/platform-studio/form-builder-advanced-fields.md` | 60 | `deleted_after_payload_extraction` | Advanced section acceptance/deferred backlog rules were compacted. | Extracted into `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`; exact old text is git-history only. |

## Next Consolidation Slice

Do not delete all exact-detail docs at once.

Recommended next extraction order:

1. Revisit scope/static lookup/static model docs after code verification.
2. Keep the large catalog/schema/view-settings docs until typed schemas or tests replace their exact examples.
