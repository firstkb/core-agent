# Platform Studio UI

Status: active compact frontend pack
Owner surface: tenant-web Platform Studio
Last compacted: 2026-04-26

## Read This When

- editing tenant-web Platform Studio UI
- changing Form Builder workspace behavior
- changing planned Navigation Builder, Action Builder, PDF Builder, or Report Builder UI entrypoints
- changing model/view UI, locks, debug modal, static model presentation, or runtime preview entry
- changing route names or route params

## Owner Sources

- `maestro/memory/modules/domains/platform-studio/`
- `maestro/memory/docs/frontend/platform-studio/README.md`
- `maestro/memory/docs/frontend/platform-studio/doc-map.md`
- `platform/frontend/docs/contracts/platform-studio.md`
- `platform/frontend/docs/modules/tenant-web.md`
- `platform/frontend/docs/modules/platform-studio/README.md`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/**`
- `platform/frontend/packages/platform-studio-core/**`

## Frontend Contract

- Platform Studio UI stays app-local in `tenant-web`.
- Platform Studio UI is a suite shell; Form Builder is the only active builder today.
- `platform-studio-core` owns non-UI contracts/helpers.
- Form Builder language is `Model` and `View`.
- Route params are `modelId` and `viewId`.
- Current active Form Builder behavior is tracked in `platform/frontend/docs/modules/platform-studio/form-builder.md`.
- Field catalog, palette sections, System Fields, rules, grid columns, and view settings are tracked in `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`.
- Old Form Builder detail/workstream docs must be routed through `maestro/memory/docs/frontend/platform-studio/form-builder-detail-triage.md` before reading.
- Tenant-web consumes backend model/view authoring endpoints.
- Tenant-web should not inject mock Form Builder records when backend-backed cache is empty.
- Debug modal may expose `Data Schema`, `Layout Blueprint`, and `UI Schema`.
- Static models use reduced action surface and hide schema-editing affordances.

## Planned / Watch

- Planned Platform Studio tools need distinct UI boundaries before implementation: Navigation Builder, Action Builder, PDF Builder, Report Builder.
- Surface contextual `runtimeApply` partial failures visibly in workspace UI.
- Preserve preview/runtime route split.
- Do not add temporary runtime grants in UI before Navigation Builder ACL exists.

## Lessons

- Do not infer identity from title or mutable key.
- Do not auto-create a `Main section` for empty new model.
- Keep non-default view editing `uiSchema`-only.
- Do not hide backend-denied static model actions behind frontend-only assumptions; backend remains source of truth.
- For Platform Studio builder UI, start new feature work with app-local focused components and controller/helper units instead of growing workspace pages. Prefer UI components, panels, dialogs, and focused helpers under roughly 300 lines. Keep route/workspace pages as orchestration shells; if they exceed roughly 500-700 lines, extract presentational components or controller/helper units before adding non-trivial UI. Avoid cross-package abstractions until reuse is proven.
