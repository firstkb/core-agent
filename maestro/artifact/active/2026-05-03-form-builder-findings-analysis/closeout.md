# Closeout

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `complete`

## Summary

The source Form Builder findings file was copied into a new Maestro artifact and analyzed against current Form Builder contracts, memory, and targeted FE/BE source. Slice 1, Slice 2, and Slice 3 are implemented and verified.

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
- Changed base `single_select` and `multi_select` authoring templates so new fields default to horizontal orientation.
- Added a transient Grid settings switch to show only visible/list-active columns above the field list without persisting the filter or dropping hidden column metadata.

## Checks

- Targeted frontend/backend checks are recorded in `evidence.md`.
- Product lite preflight passed after Slice 3.

## Memory

Updated planned-work memory to move Slice 1, Slice 2, and Slice 3 accepted behavior from planned/open work to code-confirmed current state.

## Next Step

Continue with Slice 4 (`FB-RT-005` choice button option styles runtime contract) or another owner-selected stabilization item.
