# Evidence

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Shape: aggregate Markdown evidence log.

## Summary

Created a separate Maestro artifact, copied the source findings file, analyzed the findings, then implemented Slice 1, Slice 2, Slice 3, and Slice 4 after owner approval. Slice 4 fixes `FB-RT-005` with a strict semantic choice-button option style contract and runtime rendering support. On 2026-05-03 the owner paused, but did not close, the Form Builder stabilization work; the original source findings file was updated with resolved statuses, resolution notes, commit references, verification, and the next lookup settings/filter slice.

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

## Changed Files

- `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md`
- `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/source-findings.md`
- `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/work.md`
- `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/solution-analysis.md`
- `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/closeout.md`
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
- `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/evidence.md`
- `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/work.md`
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

## Browser / Visual Evidence

- Skipped for Slice 4. The implementation uses strict semantic variants and existing product tokens; no local browser/dev-stack smoke was requested in this pass.

## Review Evidence

- Maestro inline self-review only. No specialist agents were used.

## Skipped Checks

- Browser smoke skipped; see note above.

## Residual Risks

- Existing uncommitted changes remain in `maestro-improvements.md` and `work.md` under the source 2026-04-30 artifact and were not reverted or included intentionally.
- Node engine mismatch warning remains in this shell (`v18.17.0` vs package `>=22.12.0`), although tenant-web typecheck/lint/tests passed.
- Ready-made `radio_group` and `checkbox_group` defaults remain unchanged pending an explicit product decision.
- Lookup field authoring settings and View lookup filters are recorded as the next likely slice and remain unimplemented.
- Slice 4 visual appearance is covered by token-backed CSS and schema/unit tests; no browser screenshot evidence has been collected yet.
- Slice 5 has focused controller coverage and typecheck/lint/preflight; no browser visual smoke was run for the Subform View title input.
