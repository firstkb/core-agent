# Closeout

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `complete`

## Summary

The source Form Builder findings file was copied into a new Maestro artifact and analyzed against current Form Builder contracts, memory, and targeted FE/BE source. Slice 1 and Slice 2 are implemented and verified.

## Outcome

- Created a separate artifact folder and preserved the source findings as `source-findings.md`.
- Wrote `solution-analysis.md` with finding-by-finding root-cause analysis, proposed fixes, evidence expectations, and implementation ordering.
- Fixed Subform Grid persistence by keeping scope `viewSettings.list.columns` as canonical and treating node `childGridColumns` as legacy non-empty fallback only.
- Fixed canonical save hydration so compacted top-level subform nodes with missing `parentId` are restored under their parent subform before grid settings are normalized.
- Fixed Form Builder sorting choices/default sort normalization so hidden/non-grid fields cannot remain selected.
- Hardened runtime list default sort so backend ignores sort fields outside the active grid projections.
- Fixed draft hydration so reconciled drift remains dirty/saveable instead of becoming the saved baseline.
- Preserved canvas scope/selection in the working document after successful save while keeping saved baselines normalized.
- Added a frontend single-flight save guard to prevent duplicate save requests from the same workspace instance.
- Made backend draft persistence atomic for model+view updates, preventing stale view conflicts from leaving a partially updated model.

## Checks

- Targeted frontend/backend checks are recorded in `evidence.md`.
- Product lite preflight passed.

## Memory

Updated planned-work memory during Slice 1 to move Subform Grid persistence and visible-grid sorting constraints from planned work to code-confirmed current state. Slice 2 did not stage the pre-existing planned-work memory edits that were already dirty before this work.

## Next Step

Continue with Slice 3 authoring UX follow-ups or another owner-selected stabilization item.
