# Closeout

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `complete`

## Summary

The source Form Builder findings file was copied into a new Maestro artifact and analyzed against current Form Builder contracts, memory, and targeted FE/BE source. Slice 1 is implemented and verified, including the owner-reported save/hydration regression.

## Outcome

- Created a separate artifact folder and preserved the source findings as `source-findings.md`.
- Wrote `solution-analysis.md` with finding-by-finding root-cause analysis, proposed fixes, evidence expectations, and implementation ordering.
- Fixed Subform Grid persistence by keeping scope `viewSettings.list.columns` as canonical and treating node `childGridColumns` as legacy non-empty fallback only.
- Fixed canonical save hydration so compacted top-level subform nodes with missing `parentId` are restored under their parent subform before grid settings are normalized.
- Fixed Form Builder sorting choices/default sort normalization so hidden/non-grid fields cannot remain selected.
- Hardened runtime list default sort so backend ignores sort fields outside the active grid projections.

## Checks

- Targeted frontend/backend checks are recorded in `evidence.md`.
- Product lite preflight passed.

## Memory

Updated planned-work memory to move Subform Grid persistence and visible-grid sorting constraints from planned work to code-confirmed current state.

## Next Step

Continue with the next stabilization slice from `solution-analysis.md`.
