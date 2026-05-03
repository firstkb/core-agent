# Evidence

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Shape: aggregate Markdown evidence log.

## Summary

Created a separate Maestro artifact, copied the source findings file, analyzed the findings, then implemented Slice 1 after owner approval. Slice 1 fixes Subform Grid settings persistence, including canonical save hydration, and constrains View Sorting to active visible Grid outputs.

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
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/controller/use-form-builder-workspace-derived-state.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-document-normalization.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-flat-workspace.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-scoped-document.ts`
- `platform/frontend/apps/tenant-web/src/features/platform-studio/forms/state/form-builder-view-normalization.ts`

## Browser / Visual Evidence

- Skipped. Slice 1 changes Form Builder state/controller/runtime guards and is covered by unit/backend checks; no browser-visible layout changed.

## Review Evidence

- Maestro inline self-review only. No specialist agents were used.

## Skipped Checks

- Browser smoke skipped because the targeted defect is persisted state/runtime sorting behavior and no layout interaction changed.

## Residual Risks

- Existing uncommitted changes remain in the source 2026-04-30 artifact and were not reverted or included intentionally.
- Node engine mismatch warning remains in this shell (`v18.17.0` vs package `>=22.12.0`), although tenant-web typecheck/lint/tests passed.
