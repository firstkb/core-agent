# Work

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `complete`
- Owner goal: Stabilize Form Builder; Slice 3 covers authoring quality-of-life follow-ups.

## Understanding

The owner found multiple Form Builder defects while working on runtime display of forms created in Form Builder. The analysis artifact classified the problems and proposed implementation slices. Slice 1 and Slice 2 are verified; the owner approved Slice 3 on 2026-05-03.

## Agreed Scope

- In: fix `FB-RT-007` by defaulting base `single_select` and `multi_select` authoring templates to horizontal orientation, adding a transient Grid settings switch to show visible/list-active columns only, adding focused frontend tests, updating evidence/memory, and committing scoped Slice 3 files in the current branch.
- Out: ready-made `radio_group` / `checkbox_group` orientation changes without explicit owner decision, persisted grid filter preferences, runtime choice button option styles (`FB-RT-005`), runtime grants, Navigation Builder ACL, Action Builder, destructive schema/data migration, release/deploy work, and unrelated artifact changes.

## Continuity Snapshot

- Latest owner correction: use `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md` as the input file and create a separate artifact folder.
- Current phase: `closeout`
- Artifact path: `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/`
- Gates / approvals: owner approved Slice 3 on 2026-05-03. No release/destructive gates are in scope.
- Evidence status: Slice 1, Slice 2, and Slice 3 checks are recorded in `evidence.md`.
- Unresolved owner decisions: whether ready-made `radio_group` / `checkbox_group` should also default to horizontal; whether Grid visible-only filter should ever be persisted as a preference.
- Next allowed action: proceed to Slice 4 or owner-selected follow-up.

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

## Plan

1. Preserve the source findings in this artifact.
2. Classify the findings into resolved, blocker, reliability, authoring UX, and contract-definition work.
3. Record concrete solution proposals with code touch points and evidence expectations.
4. Implement Slice 1 grid/sorting correctness.
5. Implement Slice 2 draft hydration/save reliability.
6. Implement Slice 3 authoring quality-of-life follow-ups.

## Risks / Gates

- Runtime grants and Navigation Builder ACL are out of scope.
- Destructive schema/data migration is out of scope.
- Choice button option styles still require a contract-first Slice 4.

## Agent / Tool Notes

- Maestro worked inline. No specialist agents were spawned.
- Existing uncommitted changes were observed in the source 2026-04-30 artifact; they must not be reverted or included unless explicitly requested.

## Evidence

- See `evidence.md`.

## Next Action

Commit scoped Slice 3 changes on the current branch, then continue with Slice 4 or another owner-selected stabilization item.
