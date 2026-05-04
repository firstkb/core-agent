# Work

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `active`
- Owner goal: Stabilize Form Builder; refine view drift warning so other View triangles show only real topology divergence.

## Understanding

The owner found multiple Form Builder defects while working on runtime display of forms created in Form Builder. The analysis artifact classified the problems and proposed implementation slices. Slices 1-6 are implemented and verified. On 2026-05-04 the owner clarified that field parameter changes must not show the yellow warning triangle on other views; only real topology divergence should.

## Agreed Scope

- In: refine `modelStructureVersion` / View-list warning triangle behavior so field setting changes and layout-only blueprint edits do not mark other views as drifted; preserve warning behavior for add/remove/move field topology changes and subform-scope topology changes.
- Out: backend/runtime grants, Navigation Builder ACL, Action Builder, destructive schema/data migration, release/deploy work, and unrelated artifact changes.

## Continuity Snapshot

- Latest owner correction: use `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md` as the input file and create a separate artifact folder.
- Current phase: `implementation verified`
- Artifact path: `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/`
- Gates / approvals: owner approved Slice 4 on 2026-05-03. No release/destructive gates are in scope.
- Evidence status: Slice 1, Slice 2, Slice 3, Slice 4, Slice 5, Slice 6, Slice 6 follow-ups, and View drift warning checks are recorded in `evidence.md`.
- Unresolved owner decisions: whether ready-made `radio_group` / `checkbox_group` should also default to horizontal; whether Grid visible-only filter should ever be persisted as a preference.
- Next allowed action: owner manual test that field parameter changes no longer show warning triangles on other views, while adding/removing fields still does.

## Decisions

- Treat `source-findings.md` as an input snapshot copied from the foreign artifact. Do not mutate the source artifact in this analysis slice.
- Keep resolved findings out of the implementation backlog except where they expose contract/doc drift.
- Start implementation with grid/scope persistence and sorting constraints before runtime Subform work.
- Treat `subformScopes[].viewSettings.list.columns` as the canonical Subform Grid storage surface; node-level `childGridColumns` is legacy compatibility only.
- Preserve transient canvas navigation in the working document after save, while keeping saved baselines normalized for dirty checks.
- Keep drift reconciliation visible as unsaved work by separating the server baseline document from the reconciled working document.
- Draft save model+view persistence must not partially update the model before a stale view conflict is detected.
- For Slice 3, change only base choice field templates to horizontal orientation; do not infer the same default for ready-made radio/checkbox presets.
- Keep the Grid visible-only switch transient UI state so it cannot mutate or drop hidden column metadata.
- For Slice 4, accepted choice button option style variants are `default`, `primary`, `secondary`, `info`, `success`, `warning`, and `danger`.
- `default` is represented by no persisted style entry; raw `backgroundColor`, `textColor`, and `borderColor` are not runtime contract and are ignored during normalization.
- Runtime single/multi-select buttons map option variants to forms package CSS classes backed by product tokens, without expanding the shared `ui-kit` Toggle API for per-item variants.
- Pause decision: do not archive or close this artifact yet; keep it active for resume.
- For Slice 5, Subform View edits the user-facing parent `Subform` node `title`; `schemaScopeId`, `tableKey`, runtime table/view names, and route identity are not renamed from this UI field.
- For Slice 6, the accepted schema flag is `uniqueValue?: boolean`; Form Builder persists only `true`, omits disabled/false values, and does not implement runtime uniqueness enforcement in this slice.
- Slice 6 follow-up scope: `Unique value` is allowed for plain `short_text`, ready-made `Email`/`Phone`, and `short_text` fields validated as email/phone; specialized text presets such as URL and suggest text remain excluded.
- Subform attention markers must propagate across scope boundaries through `subformScopes[].parentSubformNodeId`.
- View-list yellow triangle is a model-topology drift signal only. Field settings and layout-only `layoutBlueprint` edits must not advance `modelStructureVersion`.

## Plan

1. Preserve the source findings in this artifact.
2. Classify the findings into resolved, blocker, reliability, authoring UX, and contract-definition work.
3. Record concrete solution proposals with code touch points and evidence expectations.
4. Implement Slice 1 grid/sorting correctness.
5. Implement Slice 2 draft hydration/save reliability.
6. Implement Slice 3 authoring quality-of-life follow-ups.
7. Implement Slice 4 choice button semantic option style contract.
8. Pause without closing and record completed work/future lookup work in the source findings file.
9. Implement Slice 5 Subform View title editing.
10. Implement Slice 6 `uniqueValue` authoring flag for email/phone text fields.
11. Implement Slice 6 follow-up for plain `short_text` unique support and Subform attention propagation.
12. Implement View drift warning topology-only structure comparison.

## Risks / Gates

- Runtime grants and Navigation Builder ACL are out of scope.
- Destructive schema/data migration is out of scope.
- Browser/visual smoke is useful for final visual acceptance of semantic button variants if the local dev stack is running.

## Agent / Tool Notes

- Maestro worked inline. No specialist agents were spawned.
- Existing uncommitted changes were observed in the source 2026-04-30 artifact; they must not be reverted or included unless explicitly requested.

## Evidence

- See `evidence.md`.

## Next Action

Owner should manually test that changing a field parameter in the Default View does not show a warning triangle on other views, while adding/removing a field still does.
