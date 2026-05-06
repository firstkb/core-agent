# Closeout

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `active`

## Summary

The source Form Builder findings file was copied into a new Maestro artifact and analyzed against current Form Builder contracts, memory, and targeted FE/BE source. Slices 1-6 are implemented and verified. Follow-up work now also removes Form Builder ownership of View Active/Inactive controls so Navigation Builder remains the owner of sidebar/runtime exposure.

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
- Replaced raw per-option color controls for choice button styles with strict semantic variants: `default`, `primary`, `secondary`, `info`, `success`, `warning`, and `danger`.
- Mapped semantic option styles through `@platform/forms` runtime schema and button rendering while ignoring raw color-only legacy entries.
- Updated the original source findings file with resolved statuses, resolution notes, commit references, verification, and the next lookup settings/filter slice.
- Restored Subform title editing from the Subform View tab while keeping `schemaScopeId`, `tableKey`, runtime table/view names, and route identity unchanged.
- Added `uniqueValue?: boolean` to Form Builder field authoring schema/UI for plain `short_text`, ready-made `Email`, ready-made `Phone`, and `short_text` fields with `validation = email | phone`; URL and suggest text presets stay excluded and are stripped from canonical payloads if stale data contains the flag.
- Restored canvas attention-marker propagation from changed Subform-scope child nodes to the parent Subform and root-scope ancestors.
- Changed frontend/backend model structure comparison to topology-only signatures so field settings and layout-only blueprint edits do not advance `modelStructureVersion` or mark other views with the yellow warning triangle.
- Removed Active/Inactive eye status from View cards and removed the View Active toggle from the View tab. `isActive` remains payload compatibility metadata, not a Form Builder authoring control.

## Checks

- Targeted frontend/backend checks are recorded in `evidence.md`.
- Product lite preflight evidence is recorded in `evidence.md`.

## Memory

Updated planned-work memory to move accepted behavior from planned/open work to code-confirmed current state, including `uniqueValue` scope, Subform attention propagation, View drift warning topology semantics, and the Navigation Builder boundary for View Active/Inactive. Per-lookup settings/View filter review remains future work.

## Next Step

Owner should manually test that Form Builder no longer shows Active/Inactive status on View cards and no longer exposes a View Active toggle in the View tab.
