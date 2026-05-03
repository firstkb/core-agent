# Work

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `complete`
- Owner goal: Stabilize Form Builder; Slice 2 covers draft hydration and save reliability.

## Understanding

The owner found multiple Form Builder defects while working on runtime display of forms created in Form Builder. The analysis artifact classified the problems and proposed implementation slices. Slice 1 is verified; the owner approved Slice 2 on 2026-05-03.

## Agreed Scope

- In: fix drifted view dirty/saveable hydration (`FB-RT-002`), false/partial save conflict risks (`FB-RT-008`), and canvas context preservation after save (`FB-RT-009`); add focused frontend/backend tests; update evidence; commit only scoped Slice 2 files in the current branch.
- Out: runtime grants, Navigation Builder ACL, Action Builder, destructive schema/data migration, release/deploy work, choice runtime styles, authoring QoL Slice 3 items, and unrelated artifact changes.

## Continuity Snapshot

- Latest owner correction: use `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md` as the input file and create a separate artifact folder.
- Current phase: `closeout`
- Artifact path: `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/`
- Gates / approvals: owner approved Slice 2 on 2026-05-03. No release/destructive gates are in scope.
- Evidence status: Slice 1 and Slice 2 checks passed in `evidence.md`.
- Unresolved owner decisions: none for Slice 2.
- Next allowed action: proceed to Slice 3 or owner-selected follow-up.

## Decisions

- Treat `source-findings.md` as an input snapshot copied from the foreign artifact. Do not mutate the source artifact in this analysis slice.
- Keep resolved findings out of the implementation backlog except where they expose contract/doc drift.
- Start implementation with grid/scope persistence and sorting constraints before runtime Subform work.
- Treat `subformScopes[].viewSettings.list.columns` as the canonical Subform Grid storage surface; node-level `childGridColumns` is legacy compatibility only.
- Preserve transient canvas navigation in the working document after save, while keeping saved baselines normalized for dirty checks.
- Keep drift reconciliation visible as unsaved work by separating the server baseline document from the reconciled working document.
- Draft save model+view persistence must not partially update the model before a stale view conflict is detected.

## Plan

1. Preserve the source findings in this artifact.
2. Classify the findings into resolved, blocker, reliability, authoring UX, and contract-definition work.
3. Record concrete solution proposals with code touch points and evidence expectations.

## Risks / Gates

- Authoring save reliability touches optimistic concurrency and should be implemented carefully, with backend tests and frontend save-guard evidence.
- Runtime grants and Navigation Builder ACL are out of scope.
- Destructive schema/data migration is out of scope.

## Agent / Tool Notes

- Maestro worked inline. No specialist agents were spawned.
- Existing uncommitted changes were observed in the source artifact and planned-work memory; they must not be reverted or included unless specifically touched for Slice 2.

## Evidence

- See `evidence.md`.

## Next Action

Complete Slice 2 implementation and verification, then commit scoped changes on the current branch.
