# Evidence

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Shape: aggregate Markdown evidence log.

## Summary

Created a separate Maestro artifact, copied the source findings file, analyzed the findings, then implemented Slice 1 and Slice 2 after owner approval. Slice 2 fixes draft hydration dirty state, canvas context preservation after save, duplicate save guarding, and atomic model+view draft persistence.

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

## Changed Files

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
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/pages/forms-ui-schema-workspace-page.tsx`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-document-normalization.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-document-storage.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-flat-workspace.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-scoped-document.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-view-normalization.ts`
- `platform/backend/modules/tenant/platformstudioformbuilder/repository.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/repository_mutation.go`
- `platform/backend/modules/tenant/platformstudioformbuilder/service_draft.go`

## Browser / Visual Evidence

- Skipped. Slice 2 changes state/save semantics and backend draft persistence; behavior is covered by targeted unit/module checks. No layout rendering changed.

## Review Evidence

- Maestro inline self-review only. No specialist agents were used.

## Skipped Checks

- Browser smoke skipped because the targeted Slice 2 defects are save/hydration state transitions and backend conflict atomicity, not visual layout.

## Residual Risks

- Existing uncommitted changes remain in the source 2026-04-30 artifact and were not reverted or included intentionally.
- Node engine mismatch warning remains in this shell (`v18.17.0` vs package `>=22.12.0`), although tenant-web typecheck/lint/tests passed.
