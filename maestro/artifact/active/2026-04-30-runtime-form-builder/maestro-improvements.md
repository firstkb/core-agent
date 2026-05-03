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

## Promotion Record

- Promotion commit: `2994022 docs(maestro): promote runtime form improvement guardrails`.
- Date: 2026-05-03.
- Scope: process/runtime guidance only; no product code changes.
- Changed canonical/supporting surfaces:
  - `.agents/skills/maestro/SKILL.md`
  - `.codex/standards/runtime/artifact-governance.md`
  - `platform/backend/AGENTS.md`
  - `platform/frontend/AGENTS.md`
  - `maestro/memory/modules/domains/platform-studio/tools/form-builder.md`
  - this backlog file, to mark promoted items.
- Checks run:
  - `python3 scripts/checks/docs_memory_check.py --check`
  - `python3 scripts/checks/check_env_policy.py --check`
  - `git diff --check` for the promoted files

## MI-001 - Enforce Service Ownership Before Backend Writes

- Status: promoted.
- Promotion result: done in `2994022`; generalized as a backend/shared-runtime
  ownership boundary rule, not hardcoded only to Form Builder.
- Problem observed: Work started in `platformstudioformbuilder` after the owner
  had already decided that runtime write behavior belongs in a separate
  `platformstudioformruntime` service/module.
- Improvement: Before backend writes, Maestro should state the target runtime
  owner, allowed package/service, and forbidden package/service in the
  execution note. If the owner has made a boundary decision, that boundary must
  be treated as a hard invariant.
- Promoted to: Maestro skill `Implementation Safety` and
  `platform/backend/AGENTS.md`.
- Acceptance test: An implementation involving new runtime write behavior
  names `platformstudioformruntime` as allowed and `platformstudioformbuilder`
  as forbidden unless explicitly approved otherwise.

## MI-002 - Add Monolith-Growth Guard For Existing Services

- Status: promoted.
- Promotion result: done in `2994022`; added as a concise backend
  responsibility-split guard.
- Problem observed: A broad service file can keep growing unless Maestro pauses
  and splits responsibilities by handler, service commands, repository reads,
  repository writes, validation, response assembly, and action/policy seams.
- Improvement: When touching a backend service that already mixes concerns or is
  near the lane file-size guardrails, Maestro should propose a minimal
  responsibility split before adding non-trivial behavior.
- Promoted to: `platform/backend/AGENTS.md` as a concise responsibility-split
  guard.
- Acceptance test: A future backend slice with new action/access/write logic
  identifies the seam where the logic attaches instead of adding it to a broad
  service by default.

## MI-003 - Preserve Existing Working Behavior By Default

- Status: promoted.
- Promotion result: done in `2994022`; added to Maestro implementation safety
  and frontend working rules.
- Problem observed: Preview runtime bulk actions were suppressed to avoid a
  missing endpoint, which removed working checkbox and bulk-action behavior.
- Improvement: If a new dependency is missing, Maestro should prefer completing
  the dependency or stopping for an owner decision instead of hiding an existing
  feature. Suppressing existing UI/API behavior requires an explicit product
  decision and a regression note.
- Promoted to: Maestro skill `Implementation Safety` and
  `platform/frontend/AGENTS.md`.
- Acceptance test: Before removing or disabling visible existing behavior,
  Maestro names the prior behavior, why it must change, and the owner-approved
  replacement.

## MI-004 - Do Not Fix Contract Gaps By Dropping Metadata

- Status: promoted.
- Promotion result: done in `2994022`; added to Maestro implementation safety,
  frontend working rules, and Form Builder runtime/preview guardrails.
- Problem observed: The preview route cleared `selection` and `bulkActions`
  metadata because execution was not wired for the preview namespace.
- Improvement: When metadata and execution are out of sync, fix the contract or
  endpoint parity. Do not drop metadata as a workaround unless the product
  decision is explicitly "read-only preview" or equivalent.
- Promoted to: Maestro skill `Implementation Safety`, `platform/frontend/AGENTS.md`,
  and Form Builder runtime/preview memory guardrails.
- Acceptance test: Runtime metadata actions have matching execution adapters or
  are explicitly marked non-executable with intentional UX, not silently removed.

## MI-005 - Add Regression Test Before Or With Behavior Guards

- Status: promoted.
- Promotion result: done in `2994022`; added as targeted regression evidence
  expectation for visibility/capability guards.
- Problem observed: A guard disabled preview bulk metadata without a test that
  would catch the expected preview behavior.
- Improvement: Any guard that changes feature visibility, route capability,
  or mutation availability should include a regression test for the preserved
  behavior or the approved new behavior.
- Promoted to: Maestro skill `Implementation Safety` and
  `platform/frontend/AGENTS.md`.
- Acceptance test: A visibility/capability guard commit includes a targeted test
  proving the intended user-visible behavior.

## MI-006 - Compare Runtime And Preview Namespaces Explicitly

- Status: promoted.
- Promotion result: done in `2994022`; kept domain-specific in Form Builder
  memory instead of making it a global Maestro rule.
- Problem observed: `/app/forms/...` and `/app/platform-studio/forms/...`
  drifted: runtime had bulk execution while preview did not, and metadata was
  then suppressed only in preview.
- Improvement: For Form Builder runtime list/form work, Maestro should compare
  runtime and preview route namespaces when touching shared metadata, actions,
  row actions, saved filters, favorites, bulk actions, or record detail.
- Promoted to: `maestro/memory/modules/domains/platform-studio/tools/form-builder.md`.
- Acceptance test: A route/action change lists whether it applies to runtime,
  preview, or both, and why.

## MI-007 - Normalize Schema Shape At Boundaries, Not In Leaf Widgets

- Status: promoted.
- Promotion result: done in `2994022`; added to frontend working rules and Form
  Builder runtime memory guardrails.
- Problem observed: Select/multi-select options were missing because renderer
  logic expected `{ value, label }` objects while Form Builder authored options
  can be `string[]`.
- Improvement: Maestro should inspect actual schema payload shape and normalize
  variants at the adapter/schema boundary before field widgets render. Leaf
  widgets should receive a stable internal contract.
- Promoted to: `platform/frontend/AGENTS.md` and Form Builder runtime memory
  guardrails.
- Acceptance test: Field renderers receive canonical options, values, and labels
  regardless of whether source payloads use legacy/simple or object shapes.

## MI-008 - Use Owner Findings As Regression Backlog

- Status: promoted.
- Promotion result: done in `2994022`; added optional `findings.md` guidance to
  artifact governance.
- Problem observed: Manual testing surfaced multiple related issues while the
  active slice was moving quickly.
- Improvement: Keep owner-discovered issues in a dedicated findings file with
  stable IDs, statuses, fixed commit, and verification. Do not bury them in chat
  or over-expand `work.md`.
- Promoted to: `.codex/standards/runtime/artifact-governance.md`.
- Acceptance test: New manual-testing defects are recorded as findings before
  being fixed or deferred.

## MI-009 - Separate Code Fix Commits From Process/Memory Commits

- Status: promoted.
- Promotion result: already covered by existing atomic commit guidance; backlog
  marked promoted in `2994022` without adding a duplicate rule.
- Problem observed: The work contains both product code changes and process
  corrections. Mixing them makes review and rollback harder.
- Improvement: When practical, commit product behavior fixes separately from
  Maestro/process/memory notes. If both must be in one commit, explain why.
- Promoted to: existing `.codex/standards/engineering/git-workflow.md` atomic
  commit guidance; no new rule needed.
- Acceptance test: A regression fix commit can be reviewed independently from a
  process-improvement commit.

## MI-010 - Do Not Treat Thread Summary As Approval Or Boundary Reset

- Status: promoted.
- Promotion result: already covered by existing Maestro compaction/resume and
  approval rules; backlog marked promoted in `2994022` without adding a
  duplicate rule.
- Problem observed: Long-running work can resume from compacted context where
  earlier owner decisions are easy to weaken or reinterpret.
- Improvement: On resumed T1+ work, reread `work.md` and name the relevant
  owner decisions before writes that touch boundaries, runtime behavior, or
  shared contracts.
- Promoted to: existing Maestro compaction/resume and approval rules; no new
  rule needed.
- Acceptance test: A resumed implementation cites the active work artifact for
  current scope and explicit owner boundary decisions.

## MI-011 - Make "Fix The Symptom" Secondary To Root Cause

- Status: promoted.
- Promotion result: done in `2994022`; added to Maestro implementation safety as
  recent diff/blame first-pass regression diagnosis.
- Problem observed: The preview bulk action issue was initially explained as
  "backend intentionally clears metadata" instead of immediately naming it as a
  regression introduced by the recent commit.
- Improvement: When the owner reports a regression after a recent commit,
  Maestro should first check `git blame` / recent diff and answer whether the
  current work caused it before discussing broader product semantics.
- Promoted to: Maestro skill `Implementation Safety`.
- Acceptance test: For regressions, the first diagnostic pass includes recent
  commit/blame evidence and a direct "caused by us / not caused by us / unknown"
  statement.

## MI-012 - Record Browser Evidence Limits Clearly

- Status: promoted.
- Promotion result: done in `2994022`; added to Maestro evidence guidance so
  skipped Browser/Computer Use does not become claimed visual verification.
- Problem observed: Browser Use was sometimes unavailable or current-pane state
  was inconsistent, but visual checks are still important for this workstream.
- Improvement: If Browser Use cannot attach, record that limitation explicitly
  and rely on targeted tests, but do not claim visual verification. Retry only
  when the app pane is available or after the owner asks for another browser
  pass.
- Promoted to: Maestro skill `Approvals And Evidence`.
- Acceptance test: Closeout separates automated/code verification from actual
  browser/visual evidence.
