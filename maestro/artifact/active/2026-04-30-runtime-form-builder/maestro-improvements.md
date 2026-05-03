# Maestro Improvement Backlog

This file captures process and prompt improvements discovered during the
`2026-04-30-runtime-form-builder` work. The goal is to reduce repeat mistakes
in future Maestro sessions before promoting selected items into canonical
skills, standards, contracts, or lane guidance.

Status values:

- `proposed`: useful candidate, not yet promoted.
- `accepted`: owner accepted, ready to promote.
- `promoted`: moved into a canonical source such as a skill, standard, contract,
  or lane `AGENTS.md`.
- `rejected`: intentionally not adopted.

## MI-001 - Enforce Service Ownership Before Backend Writes

- Status: proposed.
- Problem observed: Work started in `platformstudioformbuilder` after the owner
  had already decided that runtime write behavior belongs in a separate
  `platformstudioformruntime` service/module.
- Improvement: Before backend writes, Maestro should state the target runtime
  owner, allowed package/service, and forbidden package/service in the
  execution note. If the owner has made a boundary decision, that boundary must
  be treated as a hard invariant.
- Candidate promotion target: Maestro skill `Coding Intake`, backend standards,
  and possibly a small backend service-boundary checklist.
- Acceptance test: An implementation involving new runtime write behavior
  names `platformstudioformruntime` as allowed and `platformstudioformbuilder`
  as forbidden unless explicitly approved otherwise.

## MI-002 - Add Monolith-Growth Guard For Existing Services

- Status: proposed.
- Problem observed: A broad service file can keep growing unless Maestro pauses
  and splits responsibilities by handler, service commands, repository reads,
  repository writes, validation, response assembly, and action/policy seams.
- Improvement: When touching a backend service that already mixes concerns or is
  near the lane file-size guardrails, Maestro should propose a minimal
  responsibility split before adding non-trivial behavior.
- Candidate promotion target: backend standards or `platform/backend/AGENTS.md`
  as a concise checklist, not duplicated into product memory.
- Acceptance test: A future backend slice with new action/access/write logic
  identifies the seam where the logic attaches instead of adding it to a broad
  service by default.

## MI-003 - Preserve Existing Working Behavior By Default

- Status: proposed.
- Problem observed: Preview runtime bulk actions were suppressed to avoid a
  missing endpoint, which removed working checkbox and bulk-action behavior.
- Improvement: If a new dependency is missing, Maestro should prefer completing
  the dependency or stopping for an owner decision instead of hiding an existing
  feature. Suppressing existing UI/API behavior requires an explicit product
  decision and a regression note.
- Candidate promotion target: Maestro skill acceptance/evidence section and a
  frontend/backend regression-safety standard.
- Acceptance test: Before removing or disabling visible existing behavior,
  Maestro names the prior behavior, why it must change, and the owner-approved
  replacement.

## MI-004 - Do Not Fix Contract Gaps By Dropping Metadata

- Status: proposed.
- Problem observed: The preview route cleared `selection` and `bulkActions`
  metadata because execution was not wired for the preview namespace.
- Improvement: When metadata and execution are out of sync, fix the contract or
  endpoint parity. Do not drop metadata as a workaround unless the product
  decision is explicitly "read-only preview" or equivalent.
- Candidate promotion target: shared frontend/backend contract standards.
- Acceptance test: Runtime metadata actions have matching execution adapters or
  are explicitly marked non-executable with intentional UX, not silently removed.

## MI-005 - Add Regression Test Before Or With Behavior Guards

- Status: proposed.
- Problem observed: A guard disabled preview bulk metadata without a test that
  would catch the expected preview behavior.
- Improvement: Any guard that changes feature visibility, route capability,
  or mutation availability should include a regression test for the preserved
  behavior or the approved new behavior.
- Candidate promotion target: Maestro implementation evidence checklist and lane
  test guidance.
- Acceptance test: A visibility/capability guard commit includes a targeted test
  proving the intended user-visible behavior.

## MI-006 - Compare Runtime And Preview Namespaces Explicitly

- Status: proposed.
- Problem observed: `/app/forms/...` and `/app/platform-studio/forms/...`
  drifted: runtime had bulk execution while preview did not, and metadata was
  then suppressed only in preview.
- Improvement: For Form Builder runtime list/form work, Maestro should compare
  runtime and preview route namespaces when touching shared metadata, actions,
  row actions, saved filters, favorites, bulk actions, or record detail.
- Candidate promotion target: Form Builder/runtime work checklist in the active
  artifact first; later a compact platform-studio runtime standard if repeated.
- Acceptance test: A route/action change lists whether it applies to runtime,
  preview, or both, and why.

## MI-007 - Normalize Schema Shape At Boundaries, Not In Leaf Widgets

- Status: proposed.
- Problem observed: Select/multi-select options were missing because renderer
  logic expected `{ value, label }` objects while Form Builder authored options
  can be `string[]`.
- Improvement: Maestro should inspect actual schema payload shape and normalize
  variants at the adapter/schema boundary before field widgets render. Leaf
  widgets should receive a stable internal contract.
- Candidate promotion target: frontend runtime form package standard and shared
  contract notes.
- Acceptance test: Field renderers receive canonical options, values, and labels
  regardless of whether source payloads use legacy/simple or object shapes.

## MI-008 - Use Owner Findings As Regression Backlog

- Status: proposed.
- Problem observed: Manual testing surfaced multiple related issues while the
  active slice was moving quickly.
- Improvement: Keep owner-discovered issues in a dedicated findings file with
  stable IDs, statuses, fixed commit, and verification. Do not bury them in chat
  or over-expand `work.md`.
- Candidate promotion target: Maestro artifact guidance.
- Acceptance test: New manual-testing defects are recorded as findings before
  being fixed or deferred.

## MI-009 - Separate Code Fix Commits From Process/Memory Commits

- Status: proposed.
- Problem observed: The work contains both product code changes and process
  corrections. Mixing them makes review and rollback harder.
- Improvement: When practical, commit product behavior fixes separately from
  Maestro/process/memory notes. If both must be in one commit, explain why.
- Candidate promotion target: Maestro closeout/commit guidance.
- Acceptance test: A regression fix commit can be reviewed independently from a
  process-improvement commit.

## MI-010 - Do Not Treat Thread Summary As Approval Or Boundary Reset

- Status: proposed.
- Problem observed: Long-running work can resume from compacted context where
  earlier owner decisions are easy to weaken or reinterpret.
- Improvement: On resumed T1+ work, reread `work.md` and name the relevant
  owner decisions before writes that touch boundaries, runtime behavior, or
  shared contracts.
- Candidate promotion target: Maestro skill resume section.
- Acceptance test: A resumed implementation cites the active work artifact for
  current scope and explicit owner boundary decisions.

## MI-011 - Make "Fix The Symptom" Secondary To Root Cause

- Status: proposed.
- Problem observed: The preview bulk action issue was initially explained as
  "backend intentionally clears metadata" instead of immediately naming it as a
  regression introduced by the recent commit.
- Improvement: When the owner reports a regression after a recent commit,
  Maestro should first check `git blame` / recent diff and answer whether the
  current work caused it before discussing broader product semantics.
- Candidate promotion target: Maestro troubleshooting guidance.
- Acceptance test: For regressions, the first diagnostic pass includes recent
  commit/blame evidence and a direct "caused by us / not caused by us / unknown"
  statement.

## MI-012 - Record Browser Evidence Limits Clearly

- Status: proposed.
- Problem observed: Browser Use was sometimes unavailable or current-pane state
  was inconsistent, but visual checks are still important for this workstream.
- Improvement: If Browser Use cannot attach, record that limitation explicitly
  and rely on targeted tests, but do not claim visual verification. Retry only
  when the app pane is available or after the owner asks for another browser
  pass.
- Candidate promotion target: existing Browser Use evidence guidance.
- Acceptance test: Closeout separates automated/code verification from actual
  browser/visual evidence.

