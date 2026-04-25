# Platform Studio Frontend Docs Map

Status: compact docs map
Last compacted: 2026-04-25

This folder is the compact retrieval map for Platform Studio tracked docs, including `platform/frontend/docs/contracts/platform-studio.md`, `platform/frontend/docs/modules/platform-studio/**`, and old `platform/frontend/docs/platform-studio/**` compatibility/supporting paths.
It does not replace tracked source docs and does not physically move them.

## Why This Exists

The tracked Platform Studio doc folder is large and mixes:

- active contracts,
- implementation plans,
- backend handoff docs,
- field catalog detail,
- prompt artifacts,
- donor/reference code notes,
- old working notes.

Agents should not read the whole folder by default.
Use this compact map first, then open only the exact source docs needed for the task.

## Default Read Order

For most Platform Studio frontend tasks:

1. `ai-memory/modules/domains/platform-studio/README.md`
2. `ai-memory/modules/domains/platform-studio/tools/README.md`
3. `ai-memory/modules/frontend/platform-studio-ui/README.md`
4. `ai-memory/docs/frontend/platform-studio/doc-map.md`
5. `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md` when deciding whether an old Form Builder doc is compatibility, exact detail, future proposal, archive, or reference-only
6. `platform/frontend/docs/contracts/platform-studio.md`
7. `platform/frontend/docs/modules/platform-studio/README.md`
8. `platform/frontend/docs/modules/platform-studio/form-builder.md` when the task is about Form Builder
9. `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` when the task is about fields, palette, rules, grid, filters, view settings, or scopes
10. The exact supporting source docs named by the relevant section.

## Hot Source Set

Read these tracked docs first only when source-level detail is required:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Read By Task

- Tool-suite or future-builder work: read `ai-memory/modules/domains/platform-studio/tools/README.md` first.
- Form Builder authoring: read `platform/frontend/docs/modules/platform-studio/form-builder.md`.
- Runtime routes/access: read `platform/frontend/docs/modules/platform-studio/form-builder.md`.
- Static/external models: read `platform/frontend/docs/modules/platform-studio/form-builder.md` plus the static-model supporting docs in `doc-map.md` only when table-specific detail is required.
- Field/palette/rules/view-settings work: read `platform/frontend/docs/modules/platform-studio/form-builder-fields.md` first, then only the specific old field/section contract if exact payload detail is required.
- Old Form Builder detail/workstream docs: read `ai-memory/docs/frontend/platform-studio/form-builder-detail-triage.md` before opening the old source path.
- Backend handoff/API/storage/runtime apply work: read `platform/backend/docs/contracts/platform-studio-form-builder.md`; for backend implementation orientation, also read `platform/backend/docs/modules/platform-studio/form-builder.md`.
- Prompt/reference reconstruction: read archive/reference candidates only when explicitly needed.

## Compatibility Pointers

These old suite-level paths are no longer active entrypoints:

- `platform/frontend/docs/platform-studio/README.md`
- `platform/frontend/docs/platform-studio/taxonomy-and-naming.md`
- `platform/frontend/docs/platform-studio/form-builder-first-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-three-schema-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-naming-contract-v1-1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-view-strategy-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-routes-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-access-and-entry-context-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-package-boundary-plan-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-static-models-schema-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-import-bundle-contract-v1.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-boundary.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-api-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-scope-payload-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-storage-and-sql-view-contract.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-validation-matrix.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-object-generation-matrix.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-migration-policy.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-first-slice-handoff.md`
- `platform/frontend/docs/platform-studio/form-builder-backend-technical-task-list.md`
- `platform/frontend/docs/platform-studio/form-builder-runtime-storage-review-brief.md`

Use the new suite and Form Builder docs instead:

- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`

## Archive Rule

Prompts, old code references, donor apps, closed task prompts, and broad workstream plans are not active truth.
Their durable outcomes belong in `ai-memory/modules/domains/platform-studio/` or this compact map.
