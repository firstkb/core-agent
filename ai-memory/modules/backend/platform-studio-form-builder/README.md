# Backend Platform Studio Form Builder

Status: active compact backend pack
Owner surface: tenant Form Builder backend
Last compacted: 2026-04-25

## Read This When

- changing `platformstudioformbuilder`
- changing Form Builder authoring endpoints, repository/service logic, migrations, runtime apply, static model seeds, runtime views, or import/export backend behavior
- changing backend seams where Form Builder hands off to planned Platform Studio tools such as Navigation Builder, Action Builder, PDF Builder, or Report Builder

## Owner Sources

- `ai-memory/modules/domains/platform-studio/`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/modules/platform-studio/form-builder.md`
- `platform/backend/modules/tenant/platformstudioformbuilder/**`
- `platform/backend/cmd/api-tenant/internal/server/routes_platform_studio_form_builder.go`
- `platform/backend/migrations/postgres/tenant/000_tenant_baseline.sql`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`

## Backend Contract

- Backend owns physical storage naming, DDL generation, persistence validation, and runtime apply.
- Authoring endpoints use stable model/view identity.
- `/authoring` is canonical; `/draft` is compatibility alias only.
- `ps_model.definition_json` owns `dataSchema + layoutBlueprint`.
- `ps_view.definition_json` owns `uiSchema`.
- Runtime apply is additive only.
- Static/external schema is read-only; root may manage views.
- Runtime apply errors should include diagnostic context.
- Active backend API/storage/runtime apply truth is tracked in `platform/backend/docs/contracts/platform-studio-form-builder.md`.
- Backend implementation read order and code-surface mapping are tracked in `platform/backend/docs/modules/platform-studio/form-builder.md`.

## Planned / Watch

- Do not expand `platformstudioformbuilder` into a catch-all backend package for every Platform Studio tool.
- Extract larger runtime record/list work to future `platformstudioformruntime`.
- Extract post-submit side effects to future `platformstudioformactions`.
- Keep Navigation/access, PDF, and report backend concerns behind explicit future contracts before implementation.
- Keep import model/data as planned work until an explicit route/service exists.
- Keep non-lookup `multi_select`/`tags` storage deferred to an explicit future slice; multiple lookup bridge-table support already exists.
- Finish lookup-heavy filter compiler path.
- Decide final managed `Export data` behavior.
- Enforce dedicated runtime-vs-preview guards after ACL model is ready.

## Lessons

- Do not fall back from `viewId` to `view.key`.
- Do not mutate model-owned data from non-default view flows.
- Do not treat runtime apply failure as total save failure if authoring save succeeded.
- Do not make destructive runtime schema changes in additive apply.
