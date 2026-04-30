# Form Builder

Status: active tool
Last compacted: 2026-04-25

## Tracked Owner Doc

- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md` for planned/open work only

## Owns

- Model and View authoring.
- Field catalog usage, field placement, layout blueprint, and view UI schema.
- Field palette sections, base field types, presets, System Fields, rules, grid columns, and view settings.
- Three-schema authoring split: `dataSchema`, `layoutBlueprint`, `uiSchema`.
- Authoring load/save under canonical `/authoring`.
- Additive runtime apply for managed form data.
- Backend API/storage/runtime apply contract and validation boundary.
- Static/external model views-only behavior.
- Runtime view entry preparation for later Navigation Builder exposure.
- Managed model export/import planning.

## Does Not Own

- Sidebar placement or module navigation exposure.
- Final runtime access/grant assignment.
- Authored events and post-submit side effects.
- PDF template configuration.
- Report definitions.
- Global Platform Studio package extraction beyond shared non-UI contracts.

## Current Guardrail

`Save` is authoring persistence plus additive runtime apply.
It is not site publication and must not silently become a Navigation Builder or Action Builder operation.

Use `form-builder-planned-work.md` before treating a remembered Form Builder
follow-up as implemented or as approved near-term scope.

Old Form Builder detail/workstream docs are not default truth.
Use `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md` before opening them.
