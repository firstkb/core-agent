# Form Builder Exact Detail Replacement Roadmap

Status: active roadmap
Last audited: 2026-04-25

This roadmap defines how to reduce the remaining Form Builder exact-detail prose
without deleting useful payload knowledge too early.

It is docs-only. It does not authorize product-code changes by itself.

## Current Position

The retained exact-detail docs are opt-in references, not active ownership docs.
Default Form Builder read path remains:

1. `platform/frontend/docs/contracts/platform-studio.md`
2. `platform/frontend/docs/modules/platform-studio/README.md`
3. `platform/frontend/docs/modules/platform-studio/form-builder.md`
4. `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
5. `platform/backend/docs/contracts/platform-studio-form-builder.md` when backend/API/storage/runtime apply is involved

Before deleting or compacting retained exact-detail docs, read:

- `maestro/memory/docs/frontend/platform-studio/form-builder-exact-detail-consolidation-audit.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`

## Non-Goals

- Do not delete the remaining exact-detail docs in bulk.
- Do not change product code from this roadmap alone.
- Do not treat old exact-detail docs as active source of truth.
- Do not convert prose into a new second docs system; replacement should move toward typed schemas, tests, generated registries, or code-backed docs.

## Replacement Gates

An exact-detail doc may be deleted only when all are true:

- equivalent durable facts are represented in active compact docs or code-owned artifacts
- replacement has verification: typed schema, unit test, generated registry, runtime validation, or explicit code-backed doc
- `form-builder-exact-detail-consolidation-audit.md` is updated in the same change
- `form-builder-detail-triage.md` is updated in the same change
- `maestro/memory/durable/current-state.md` is updated if the retained count changes
- `scripts/ai/docs_memory_check.py --check` still passes

## Replacement Matrix

| Retained doc | Future replacement target | Required verification before deletion |
| --- | --- | --- |
| `form-builder-accepted-registry.md` | generated or code-backed accepted registry for sections, accepted items, deferred items, and rejected items | registry export plus tests proving section order and accepted item lists |
| `form-builder-section-tree.md` | generated palette projection from the accepted registry | generated output or tests proving palette section membership |
| `form-builder-field-catalog.md` | structured/generated field catalog split by registry family | generated registry plus tests for field type/preset/layout/content separation |
| `form-builder-v2-field-contract.md` | typed field contract/schema docs in `platform-studio-core` or equivalent package surface | exported types/schemas plus tests for persisted shapes and registry layer boundaries |
| `form-builder-core-data-fields.md` | typed base-field settings schemas and fixtures | tests for value shape, settings, compatible presets, and filter operators |
| `form-builder-choice-preset-inspector-schema.md` | typed choice preset inspector schemas and fixtures | tests for radio/checkbox settings, option shape, display settings, and validation rules |
| `form-builder-relationships.md` | typed lookup/static model settings schemas plus backend contract alignment | tests for lookup presets, selection mode, display mode, source model, and storage boundaries |
| `form-builder-system-fields.md` | typed semantic binding schema and inspector fixtures | tests for root-only binding, unique semantic roles, create/bind behavior, and workflow status values |
| `form-builder-view-settings-contract.md` | typed `viewSettings` schemas and filter fixtures | tests for actions, list sorting, columns, page filters, quick filters, date presets, and lookup tokens |
| `form-builder-view-settings-inspector-contract.md` | inspector behavior fixtures or UI-level tests | tests/fixtures for inspector sections, modal flows, row rendering, and validation messages |
| `form-builder-slice-1-inspector-and-view-schema.md` | canonical minimal saved Form Builder fixture | schema validation test for minimal saved model/view/ui schema example |
| `form-builder-static-lookup-naming-policy-v1.md` | static lookup naming enforcement in code/tests | tests preventing raw FK-column leakage into `storageKey` |
| `form-builder-static-models-integration-v1.md` | code-confirmed static/external model registry and docs | tests/fixtures for table treatment, source boundaries, and static/external model flags |
| `data-schema-storage-rules.md` | backend-owned storage contract plus validation/code fixtures | backend/frontend tests proving logical-vs-physical storage boundaries and external/static storage rules |

## Recommended Order

1. Accepted registry and section tree.
2. Static lookup naming and static model integration.
3. Base field settings and choice preset inspector schemas.
4. System Fields and relationship lookup schemas.
5. View settings and inspector details.
6. Large field catalog and V2 field contract.
7. Storage rules after backend contract/code coverage exists.

## Current Decision

Keep all retained exact-detail docs until a future implementation slice explicitly
names the replacement target and verification method.

This roadmap is the planning layer only.
