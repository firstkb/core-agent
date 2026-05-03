# Work

- Work ID: `2026-05-03-form-builder-findings-analysis`
- Status: `complete`
- Owner goal: Stabilize Form Builder, starting with Slice 1 from the findings analysis.

## Understanding

The owner found multiple Form Builder defects while working on runtime display of forms created in Form Builder. The analysis artifact classified the problems and proposed implementation slices. The owner approved Slice 1 and asked to fix it in the current branch.

## Agreed Scope

- In: fix Subform Grid settings persistence (`FB-RT-010`), constrain View Sorting to active visible Grid outputs (`FB-RT-001`), add focused frontend/backend tests, update evidence, and commit only this slice's files in the current branch.
- Out: runtime grants, Navigation Builder ACL, Action Builder, destructive schema/data migration, release/deploy work, and unrelated artifact changes.

## Continuity Snapshot

- Latest owner correction: use `maestro/artifact/active/2026-04-30-runtime-form-builder/findings.md` as the input file and create a separate artifact folder.
- Current phase: `closeout`
- Artifact path: `maestro/artifact/active/2026-05-03-form-builder-findings-analysis/`
- Gates / approvals: owner approved Slice 1 on 2026-05-03. No high-risk gates are in scope.
- Evidence status: source file copied; required Maestro/platform memory and targeted Form Builder source/docs inspected; implementation checks passed in `evidence.md`.
- Unresolved owner decisions: none for Slice 1.
- Next allowed action: proceed to the next stabilization slice.

## Decisions

- Treat `source-findings.md` as an input snapshot copied from the foreign artifact. Do not mutate the source artifact in this analysis slice.
- Keep resolved findings out of the implementation backlog except where they expose contract/doc drift.
- Start implementation with grid/scope persistence and sorting constraints before runtime Subform work.
- Treat `subformScopes[].viewSettings.list.columns` as the canonical Subform Grid storage surface; node-level `childGridColumns` is legacy compatibility only.

## Plan

1. Preserve the source findings in this artifact.
2. Classify the findings into resolved, blocker, reliability, authoring UX, and contract-definition work.
3. Record concrete solution proposals with code touch points and evidence expectations.

## Risks / Gates

- Authoring save reliability touches optimistic concurrency and should be implemented carefully, with backend tests and frontend conflict UX tests.
- Runtime grants and Navigation Builder ACL are out of scope.
- Destructive schema/data migration is out of scope.

## Agent / Tool Notes

- Maestro worked inline. No specialist agents were spawned.
- Existing uncommitted changes were observed in the source artifact and planned-work memory; they must not be reverted or included unless specifically touched for Slice 1.

## Evidence

- See `evidence.md`.

## Next Action

Complete Slice 1 implementation and verification, then commit scoped changes on the current branch.
