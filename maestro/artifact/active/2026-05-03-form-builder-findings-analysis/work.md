# Work

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `complete`
- Owner goal: Stabilize Form Builder; Slice 4 covers choice button option style runtime contract.

## Understanding

The owner found multiple Form Builder defects while working on runtime display of forms created in Form Builder. The analysis artifact classified the problems and proposed implementation slices. Slice 1, Slice 2, and Slice 3 are verified; the owner approved Slice 4 on 2026-05-03 with a strict semantic style-list direction.

## Agreed Scope

- In: fix `FB-RT-005` by replacing raw per-option button colors with strict semantic variants, normalizing Form Builder `choiceDisplay.optionStyles`, mapping variants into `@platform/forms` runtime options, applying approved runtime button/toggle styling, updating focused tests/docs/memory/evidence, and committing scoped Slice 4 files in the current branch.
- Out: arbitrary color pickers, renderer-side color guessing, backend/runtime grants, Navigation Builder ACL, Action Builder, destructive schema/data migration, release/deploy work, and unrelated artifact changes.

## Continuity Snapshot

- Latest owner correction: use `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md` as the input file and create a separate artifact folder.
- Current phase: `closeout`
- Artifact path: `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/`
- Gates / approvals: owner approved Slice 4 on 2026-05-03. No release/destructive gates are in scope.
- Evidence status: Slice 1, Slice 2, Slice 3, and Slice 4 checks are recorded in `evidence.md`.
- Unresolved owner decisions: whether ready-made `radio_group` / `checkbox_group` should also default to horizontal; whether Grid visible-only filter should ever be persisted as a preference.
- Next allowed action: owner-selected follow-up after Slice 4 closeout.

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

## Plan

1. Preserve the source findings in this artifact.
2. Classify the findings into resolved, blocker, reliability, authoring UX, and contract-definition work.
3. Record concrete solution proposals with code touch points and evidence expectations.
4. Implement Slice 1 grid/sorting correctness.
5. Implement Slice 2 draft hydration/save reliability.
6. Implement Slice 3 authoring quality-of-life follow-ups.
7. Implement Slice 4 choice button semantic option style contract.

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

Commit scoped Slice 4 changes on the current branch, then continue with another owner-selected stabilization item.
