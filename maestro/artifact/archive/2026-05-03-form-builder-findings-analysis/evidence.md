# Evidence

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Shape: aggregate Markdown evidence log.

## Summary

Created a separate Maestro artifact, copied the source findings file, analyzed the findings, then implemented Slice 1, Slice 2, Slice 3, and Slice 4 after owner approval. Slice 4 fixes `FB-RT-005` with a strict semantic choice-button option style contract and runtime rendering support. On 2026-05-03 the owner paused, but did not close, the Form Builder stabilization work; the original source findings file was updated with resolved statuses, resolution notes, commit references, verification, and the next lookup settings/filter slice. On 2026-05-07 the Project static model slice added canonical `Projects`, `industry_size`, and `industry_type` Form Builder metadata and tenant schema migration.

## Commands / Checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| `cp maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md .../source-findings.md` | passed | `source-findings.md` exists | Input snapshot copied without editing source artifact. |
| Required Maestro/platform reads | passed | `AGENTS.md`, Maestro docs, memory baseline, platform lane rules | Read before planning. |
| Targeted Form Builder source/docs inspection | passed | `solution-analysis.md` references inspected code paths | Read focused FE/BE docs and source files only. |
| `pnpm --filter @platform/tenant-web test -- form-builder-workspace-grid.test.ts` | passed | 1 file / 5 tests passed | Shows Subform Grid persistence, canonical save hydration, and sorting visibility constraints. Node version warning observed: package wants Node `>=22.12.0`, current shell reports Node `v18.17.0`. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` exited 0 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` exited 0 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web test` | passed | 7 files / 28 tests passed | Tenant-web Vitest suite. Same Node engine warning observed. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Run from `platform/backend`. |
| `python3 scripts/checks/docs_memory_check.py --check` | passed | `Docs/memory check passed.` | Artifact-only docs/memory hygiene check. |
| `python3 scripts/checks/check_env_policy.py --check` | passed | `Env policy check passed.` | Environment-file policy check. |
| `scripts/preflight.sh` | passed | lite preflight passed | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm --filter @platform/tenant-web test -- form-builder-workspace-save.test.ts form-builder-workspace-grid.test.ts` | passed | 2 files / 7 tests passed | Shows Slice 2 save hydration/navigation behavior plus Slice 1 grid regression coverage. Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web test` | passed | 8 files / 30 tests passed | Full tenant-web Vitest suite after Slice 2. Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` exited 0 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` exited 0 on rerun | First parallel lint attempt failed with transient missing Vite timestamp module; standalone rerun passed. Same Node engine warning observed. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Includes atomic draft conflict regression test. |
| `scripts/preflight.sh` | passed | lite preflight passed after Slice 2 | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm --filter @platform/tenant-web test -- forms-builder-library.test.ts grid-settings-panel.test.ts` | passed | 2 files / 2 tests passed | Shows base choice template horizontal defaults and Grid visible-only filter helper behavior. Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` exited 0 after Slice 3 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` exited 0 after Slice 3 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web test` | passed | 10 files / 32 tests passed | Full tenant-web Vitest suite after Slice 3. Same Node engine warning observed. |
| `scripts/preflight.sh` | passed | lite preflight passed after Slice 3 | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm --filter @platform/tenant-web test -- form-builder-workspace-choice-field.test.ts` | passed | 1 file / 2 tests passed | Shows semantic option style updates, default removal, rename, and option removal behavior. Same Node engine warning observed. |
| `pnpm --filter @platform/forms test -- runtime-form.test.ts` | passed | 1 file / 10 tests passed | Shows runtime schema mapping for semantic option variants and ignores raw color-only legacy styles. Same Node engine warning observed. |
| `pnpm --filter @platform/forms typecheck` | passed | `tsc -p tsconfig.json --noEmit` exited 0 after Slice 4 | Same Node engine warning observed. |
| `pnpm --filter @platform/forms lint` | passed | `eslint src` exited 0 after Slice 4 | Same Node engine warning observed. |
| `pnpm --filter @platform/forms test` | passed | 1 file / 10 tests passed | Full forms package Vitest suite. Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` exited 0 after Slice 4 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` exited 0 after Slice 4 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web test` | passed | 11 files / 34 tests passed | Full tenant-web Vitest suite after Slice 4. Same Node engine warning observed. |
| `scripts/preflight.sh` | passed | lite preflight passed after Slice 4 | Includes docs memory, env policy, and runtime drift checks. |
| `git diff --check` | passed | no output | Whitespace check after pause/source-findings docs update. |
| `scripts/preflight.sh` | passed | lite preflight passed after pause docs update | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm --filter @platform/tenant-web test -- form-builder-workspace-grid.test.ts` | passed | 1 file / 6 tests passed | Slice 5 regression covers active Subform title update without changing `schemaScopeId` or `tableKey`. Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` exited 0 after Slice 5 | Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` exited 0 after Slice 5 | Same Node engine warning observed. |
| `git diff --check` | passed | no output | Whitespace check after Slice 5. |
| `scripts/preflight.sh` | passed | lite preflight passed after Slice 5 | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm --filter @platform/tenant-web test -- form-builder-workspace-unique-value.test.ts` | passed | 1 file / 2 tests passed | Slice 6 regression covers support rules and compact canonical payload for `uniqueValue`. Same Node engine warning observed. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` exited 0 after Slice 6 | Same Node engine warning observed. |
| `pnpm --filter @platform/platform-studio-core typecheck` | passed | `tsc -p tsconfig.json --noEmit` exited 0 after Slice 6 | Same Node engine warning observed. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Covers backend package compile/test after authoring normalizer update. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` exited 0 after Slice 6 | Same Node engine warning observed. |
| `pnpm --filter @platform/platform-studio-core lint` | passed | `eslint src` exited 0 after Slice 6 | Same Node engine warning observed. |
| `git diff --check` | passed | no output | Whitespace check after Slice 6. |
| `scripts/preflight.sh` | passed | lite preflight passed after Slice 6 | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm --filter @platform/tenant-web test -- form-builder-workspace-unique-value.test.ts` | blocked | `EACCES` scanning `platform/frontend/.local/config/caddy` | Root workspace scan hit local root-owned Caddy config; reran from package directory. |
| `pnpm test -- form-builder-workspace-unique-value.test.ts` | passed | 1 file / 2 tests passed | Ran from `platform/frontend/apps/tenant-web`; covers plain `short_text`, email/phone, and excluded URL/suggest text support rules. |
| `pnpm test -- form-builder-workspace-diff-helpers.test.ts` | passed | 1 file / 1 test passed | Ran from `platform/frontend/apps/tenant-web`; covers Subform-scope child change propagation to parent Subform/root ancestors. |
| `pnpm test` | passed | 13 files / 38 tests passed | Full `@platform/tenant-web` Vitest suite from package directory after Slice 6 follow-up. |
| `pnpm typecheck` | passed | `tsc --noEmit` exited 0 | Ran from `platform/frontend/apps/tenant-web` after Slice 6 follow-up. |
| `pnpm lint` | passed | `eslint .` exited 0 | Ran from `platform/frontend/apps/tenant-web`; first lint attempt hit a transient deleted `vite.config.ts.timestamp-*` file, retry passed. |
| `git diff --check` | passed | no output | Whitespace check after Slice 6 follow-up. |
| `scripts/preflight.sh` | passed | lite preflight passed after Slice 6 follow-up | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm test -- form-builder-workspace-diff-helpers.test.ts` | passed | 1 file / 3 tests passed | Covers topology-only structure signature: field settings ignored, field add/move detected, Subform attention propagation preserved. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Covers backend structure version not advancing for field setting changes. |
| `pnpm test` | passed | 13 files / 40 tests passed | Full `@platform/tenant-web` Vitest suite from package directory after View drift warning fix. |
| `pnpm typecheck` | passed | `tsc --noEmit` exited 0 | Ran from `platform/frontend/apps/tenant-web` after View drift warning fix. |
| `pnpm lint` | passed | `eslint .` exited 0 | Ran from `platform/frontend/apps/tenant-web` after View drift warning fix. |
| `git diff --check` | passed | no output | Whitespace check after View drift warning fix. |
| `scripts/preflight.sh` | passed | lite preflight passed after View drift warning fix | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm test` | passed | full tenant-web Vitest suite | Ran from `platform/frontend/apps/tenant-web` after View Active/Inactive UI removal. |
| `pnpm typecheck` | passed | `tsc --noEmit` exited 0 | Ran from `platform/frontend/apps/tenant-web` after View Active/Inactive UI removal. |
| `pnpm lint` | passed | `eslint .` exited 0 | Ran from `platform/frontend/apps/tenant-web` after View Active/Inactive UI removal. |
| `git diff --check` | passed | no output | Whitespace check after View Active/Inactive UI removal. |
| `scripts/preflight.sh` | passed | lite preflight passed after View Active/Inactive UI removal | Includes docs memory, env policy, and runtime drift checks. |
| `pnpm typecheck` | passed | `tsc --noEmit` exited 0 | Ran from `platform/frontend/apps/tenant-web` after retiring `isActive` from Form Builder view config. |
| `pnpm typecheck` | passed | `tsc -p tsconfig.json --noEmit` exited 0 | Ran from `platform/frontend/packages/platform-studio-core` after removing `ViewDefinition.isActive`. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Covers backend stripping `isActive` from new view config payloads while preserving DB/API compatibility metadata. |
| `pnpm test` | passed | 13 files / 40 tests passed | Full `@platform/tenant-web` Vitest suite from package directory after `isActive` config retirement. |
| `pnpm lint` | passed | `eslint .` exited 0 | Ran from `platform/frontend/apps/tenant-web` after `isActive` config retirement. |
| `pnpm lint` | passed | `eslint src` exited 0 | Ran from `platform/frontend/packages/platform-studio-core` after `isActive` config retirement. |
| `git diff --check` | passed | no output | Whitespace check after `isActive` config retirement. |
| `scripts/preflight.sh` | passed | lite preflight passed after `isActive` config retirement | Includes docs memory, env policy, and runtime drift checks. |
| `go run ./tools/generate_bundle.go` | passed | tenant bundle generated with 9 migrations | Run from `platform/backend` after adding migration `008_platform_studio_static_model_projects.sql`. |
| `psql -U postgres -d codex_project_smoke_20260507_01 -v ON_ERROR_STOP=1 -f platform/backend/bundle/tenant_schema_full.sql` | passed | full tenant bundle applied to disposable DB | First run exposed a CTE scope bug in migration 008; migration was fixed and the rerun passed. |
| Project smoke introspection | passed | `ps_model` rows: `projects`, `industry_size`, `industry_type`; `projects` columns: `industry_size_id`, `industry_type_id`; `ps_view.definition_json ? 'isActive' = false` | Also confirmed `vw_projects` includes lookup label outputs for Company, CM, GC, Contact, Industry Size, and Industry Type. |
| `go run ./cmd/migrate --env ./env/migrate.local.env.example` | passed | local tenant migration applied | Applied `008_platform_studio_static_model_projects` to local `108-demo` and `108-sandbox`. Command exited 0 with no stdout. |
| Local tenant DB introspection | passed | `108-demo` and `108-sandbox` both report migration `008`; `ps_model` includes `projects`, `industry_size`, `industry_type`; `projects` exposes `industry_size_id` / `industry_type_id` only | Run after owner reported not seeing the new tables/models in the working DB. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Run from `platform/backend` after Project static model migration/docs. |
| `go test ./cmd/migrate/... ./internal/platform/postgres/...` | passed | migrate and postgres package tests passed | Run from `platform/backend` after migration/bundle update. |
| `git diff --check` | passed | no output | Whitespace check after Project static model migration/docs. |
| `python3 scripts/checks/docs_memory_check.py --check` | passed | `Docs/memory check passed.` | Docs/memory hygiene after docs/artifact/memory updates. |
| `python3 scripts/checks/check_env_policy.py --check` | passed | `Env policy check passed.` | Env policy check after docs/artifact/memory updates. |
| `scripts/preflight.sh` | passed | lite preflight passed | Includes docs memory, env policy, and runtime drift checks after Project static model migration/docs. |
| Owner schema review | failed then fixed | `industry_size` / `industry_type` initially lacked `guid`, `created_at`, `updated_at`, and `set_updated_at()` trigger | Corrected with migration `009_industry_reference_audit_columns.sql`; schema docs and memory lesson updated. |
| `go run ./tools/generate_bundle.go` | passed | tenant bundle generated with 10 migrations | Run from `platform/backend` after adding corrective migration `009_industry_reference_audit_columns.sql`. |
| `go run ./cmd/migrate --env ./env/migrate.local.env.example` | passed | local tenant migration applied | Applied `009_industry_reference_audit_columns` to `108-demo` and `108-sandbox`. Command exited 0 with no stdout. |
| Local industry audit introspection | passed | `108-demo` and `108-sandbox` both have `guid`, `created_at`, `updated_at` and update triggers on `industry_size` / `industry_type` | `108-demo` also confirms GUID/created/updated runtime metadata in `ps_model.definition_json`. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Run from `platform/backend` after corrective migration. |
| `go test ./cmd/migrate/... ./internal/platform/postgres/...` | passed | migrate and postgres package tests passed | Run from `platform/backend` after corrective migration. |
| `git diff --check` | passed | no output | Whitespace check after corrective migration. |
| `python3 scripts/checks/docs_memory_check.py --check` | passed | `Docs/memory check passed.` | Docs/memory hygiene after memory lesson/doc updates. |
| `python3 scripts/checks/check_env_policy.py --check` | passed | `Env policy check passed.` | Env policy check after corrective migration docs. |
| `scripts/preflight.sh` | passed | lite preflight passed | Includes docs memory, env policy, and runtime drift checks after corrective migration. |
| Owner runtime Form Builder report | failed then fixed | `industry_size` / `industry_type` authoring save returned `invalid payload`; `Projects` view opened with duplicate tabs and empty active tab content | Root causes: raw-vs-normalized static model id comparison and missing seeded UI node `containerKey` values. |
| `go run ./tools/generate_bundle.go` | passed | tenant bundle generated with 11 migrations | Run from `platform/backend` after adding migration `010_projects_static_layout_blueprint_fix.sql`. |
| `go run ./cmd/migrate --env ./env/migrate.local.env.example` | passed | local tenant migration applied | Applied `010_projects_static_layout_blueprint_fix` to `108-demo` and `108-sandbox`. Command exited 0 with no stdout. |
| Local Projects layout introspection | passed | `108-demo`: 3 model layout containers, 31 view UI nodes, 0 old `root.tabs.root_tabs_projects*` entries; `108-sandbox`: 3 containers, 31 nodes | Confirms Projects Main/Details has one canonical tab tree with fields under the expected tab nodes. |
| `go test ./modules/tenant/platformstudioformbuilder` | passed | module tests passed | Includes regression coverage for saving a static model with underscore id `industry_type`. |
| `go test ./cmd/migrate/... ./internal/platform/postgres/...` | passed | migrate and postgres package tests passed | Run from `platform/backend` after Projects layout correction migration. |
| `git diff --check` | passed | no output | Whitespace check after Projects layout correction and memory/artifact updates. |
| `python3 scripts/checks/docs_memory_check.py --check` | passed | `Docs/memory check passed.` | Docs/memory hygiene after memory/artifact updates. |
| `python3 scripts/checks/check_env_policy.py --check` | passed | `Env policy check passed.` | Env policy check after memory/artifact updates. |
| `scripts/preflight.sh` | passed | lite preflight passed | Includes docs memory, env policy, and runtime drift checks after Projects layout correction. |
| Owner lookup filter decision | accepted | use `lookupConfig.filters[]`, not a special `activeFilter`; first slice exposes only active-record filter for `DB lookup`, `DB lookup value`, and `DB lookup multi` | Runtime lookup query enforcement remains out of scope for this Form Builder authoring slice. |
| `pnpm --filter @platform/tenant-web test -- form-builder-workspace-lookup-source-picker` | passed | 1 file / 2 tests passed | Covers saving and removing the active-record filter in `lookupConfig.filters[]`. |
| `pnpm --filter @platform/tenant-web typecheck` | passed | `tsc --noEmit` exited 0 | Run after adding lookup filter authoring types/UI. Node engine warning remains in this shell. |
| `pnpm --filter @platform/tenant-web lint` | passed | `eslint .` exited 0 | Run after lookup source picker UI updates. Node engine warning remains in this shell. |
| `git diff --check` | passed | no output | Whitespace check after lookup filter authoring. |
| `python3 scripts/checks/docs_memory_check.py --check` | passed | `Docs/memory check passed.` | Docs/memory hygiene after docs/artifact/memory updates. |
| `python3 scripts/checks/check_env_policy.py --check` | passed | `Env policy check passed.` | Env policy check after docs/artifact/memory updates. |
| `scripts/preflight.sh` | failed then passed | default system `python3` is 3.9.6 and lacks `tomllib`; rerun with `/opt/homebrew/bin` first passed lite preflight | No code failure; environment interpreter mismatch only. |

## Changed Files

- `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/source-findings.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/solution-analysis.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/closeout.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
- `platform/backend/modules/tenant/platformstudioformbuilder/runtime_list.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/service_test.go`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-document-updates.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-document-hydration.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-field-scope-grid.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-grid.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-navigation.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-save.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-workspace-derived-state.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-draft-hydration.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-draft-save-action.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/grid-inspector-tab-body.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-button-styles-section.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/choice-field-settings.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/grid-settings-panel.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/grid-settings-panel.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selected-field-settings-section.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-choice-field.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-choice-field.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-normalization-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-library.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-library.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-placeholder-data.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-document-normalization.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-document-storage.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-flat-workspace.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-scoped-document.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-view-normalization.ts`
- `platform/backend/modules/tenant/platformstudioformbuilder/repository.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/repository_mutation.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/service_draft.go`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/frontend/packages/forms/src/index.ts`
- `platform/frontend/packages/forms/src/runtime-form-schema.ts`
- `platform/frontend/packages/forms/src/runtime-form.css`
- `platform/frontend/packages/forms/src/runtime-form.test.ts`
- `platform/frontend/packages/forms/src/runtime-form.tsx`
- `platform/frontend/packages/forms/src/runtime/fields/choice-field-utils.ts`
- `platform/frontend/packages/forms/src/runtime/fields/multi-select-field.tsx`
- `platform/frontend/packages/forms/src/runtime/fields/select-field.tsx`
- `platform/frontend/packages/forms/src/runtime/runtime-form-types.ts`

## Slice 5 Changed Files

- `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-inspector-tab-body.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-panel.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-document-updates.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-grid.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-view-grid-handlers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-workspace-derived-state.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Slice 6 Changed Files

- `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `platform/backend/modules/tenant/platformstudioformbuilder/authoring_normalize.go`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selected-field-settings-section.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-inspector-tab-body.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/text-field-settings.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-data-schema.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-selected-field-settings-handlers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-unique-value.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-workspace-controller.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-authoring-context.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-placeholder-data.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`
- `platform/frontend/packages/platform-studio-core/src/contracts/model.ts`
- `platform/frontend/packages/platform-studio-core/src/schemas/model.schema.ts`

## Slice 6 Follow-up Changed Files

- `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/closeout.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-diff-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-diff-helpers.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-data-schema.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-selected-field-settings-handlers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-unique-value.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-unique-value.test.ts`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## View Drift Warning Changed Files

- `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/closeout.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
- `platform/backend/modules/tenant/platformstudioformbuilder/service.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/service_test.go`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-draft-save.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-diff-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-diff-helpers.test.ts`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`

## View Active/Inactive UI Changed Files

- `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/closeout.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/forms-index-page-helpers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/forms-index-views-panel.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-inspector-tab-body.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-panel.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/view-settings-root-sections.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-view-grid-handlers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-view-metadata.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
- `platform/frontend/docs/modules/platform-studio/form-builder.md`

## Project Static Model Changed Files

- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/closeout.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
- `platform/backend/bundle/tenant_schema_full.sql`
- `platform/backend/docs/contracts/platform-studio-form-builder.md`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/docs/reference/tenant-import-boundary.md`
- `platform/backend/migrations/postgres/tenant/008_platform_studio_static_model_projects.sql`

## Industry Audit Correction Changed Files

- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/memory/modules/domains/schema-and-tenancy/lessons.md`
- `platform/backend/bundle/tenant_schema_full.sql`
- `platform/backend/docs/contracts/schema-tenancy.md`
- `platform/backend/docs/reference/import-field-mapping.md`
- `platform/backend/migrations/postgres/tenant/009_industry_reference_audit_columns.sql`

## Preset DB Lookup Authoring Evidence

- Implemented Form Builder-only authoring controls for preset lookup shortcuts:
  `Contact` / `Contacts`, `Company` / `Companies`, and `Project` / `Projects`.
- Display template selections persist through `lookupConfig.displayTemplate`,
  `displayFields`, `lookupConfig.searchFields`, and `lookupConfig.sortField`.
- Preset filter values persist through `lookupConfig.filters[]` with
  `operator: "in"`. Current authored filters are Contact `job_type_id` /
  `company_id`, Company `company_type_id` / `main_company_id`, and Project
  `company_id`.
- Active-record filtering is intentionally not authored for these preset lookup
  fields; runtime/query handling remains separate follow-up scope.

Checks:

- `git diff --check` passed.
- `../../node_modules/.bin/vitest run src/features/platform-studio/forms/forms-preset-lookup-settings.test.ts src/features/platform-studio/forms/forms-builder-library.test.ts` passed from `platform/frontend/apps/tenant-web`.
- Initial root-level vitest invocation failed because Vitest scanned
  `platform/frontend/.local/config/caddy` and hit `EACCES`; the same targeted
  tests passed when run from the tenant-web app workspace.
- `pnpm --filter @platform/tenant-web typecheck` passed.
- `pnpm --filter @platform/tenant-web lint` passed.
- `scripts/preflight.sh` failed under the system Python because `tomllib` is not
  available; `env PATH="/opt/homebrew/bin:$PATH" scripts/preflight.sh` passed.

Browser QA:

- Used Browser Use against
  `https://demo.platform.localhost/builder/forms/lookup/views/view-default`.
- Selected the canvas `Reported By` preset lookup field and confirmed the
  settings panel shows `Display template`, Contact filter fields, and no
  `Only active records` preset control.
- Interacted with the template select and filter inputs, then reloaded the page
  to discard QA-only unsaved changes; `Save` returned to disabled.

## Preset DB Lookup Authoring Changed Files

- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/archive/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/memory/modules/domains/platform-studio/tools/form-builder-planned-work.md`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/lookup-field-settings.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selected-field-settings-section.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/components/selection-inspector-tab-body.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-selected-field-settings-handlers.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/form-builder-workspace-system-fields.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-builder-library.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-preset-lookup-settings.test.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/forms-preset-lookup-settings.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/locales/en.ts`
- `platform/frontend/apps/tenant-web/src/locales/es.ts`
- `platform/frontend/docs/modules/platform-studio/form-builder-fields.md`

## Browser / Visual Evidence

- Preset DB lookup authoring was checked with Browser Use in the in-app browser.
- Earlier Slice 4 browser smoke remains skipped. The implementation uses strict semantic variants and existing product tokens; no local browser/dev-stack smoke was requested in that pass.

## Review Evidence

- Maestro inline self-review only. No specialist agents were used.

## Skipped Checks

- Browser smoke is still skipped for the earlier Slice 4 only; current preset DB
  lookup authoring has Browser Use evidence.
- Root-level targeted Vitest invocation was skipped after EACCES on
  `platform/frontend/.local/config/caddy`; targeted app-workspace Vitest was
  used instead and passed.

## Residual Risks

- Existing uncommitted changes remain in `maestro-improvements.md` and `work.md` under the source 2026-04-30 artifact and were not reverted or included intentionally.
- Node engine mismatch warning remains in this shell (`v18.17.0` vs package `>=22.12.0`), although tenant-web typecheck/lint/tests passed.
- Ready-made `radio_group` and `checkbox_group` defaults remain unchanged pending an explicit product decision.
- Preset DB lookup runtime/query enforcement and View lookup filters remain follow-up scope; current work is Form Builder authoring and schema persistence only.
- Slice 4 visual appearance is covered by token-backed CSS and schema/unit tests; no browser screenshot evidence has been collected yet.
- Slice 5 has focused controller coverage and typecheck/lint/preflight; no browser visual smoke was run for the Subform View title input.
- Slice 6 intentionally does not enforce uniqueness at runtime/create/edit/save and does not touch `@platform/forms`; that work remains with the owner-selected follow-up.
- Slice 6 follow-up has focused controller coverage and typecheck/lint/preflight; no browser visual smoke was run for the selected-field settings panel or canvas attention marker.
- View drift warning fix has focused unit/backend coverage and typecheck/lint/preflight; no browser visual smoke was run for the View list triangle.
- View Active/Inactive UI removal has typecheck/lint/full tenant-web test coverage; no browser visual smoke was run for the Views panel or View tab.
- Project Access List / `projectsaccess` management remains future scope and was intentionally not added to the Projects form.
- Project migration uses `NOT VALID` FK constraints for existing `contractor_company_id`, `subcontractor_company_id`, and `contact_id` so legacy orphan rows cannot block tenant migration; new writes are still checked by PostgreSQL.
