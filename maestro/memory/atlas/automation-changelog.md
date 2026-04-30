# Atlas Automation Changelog

Status: active operational changelog

This changelog starts at the `maestro/memory/atlas` cutover.
Earlier Atlas automation history is recoverable from git history for the former
`platform/docs/ai/automation-changelog.md` path.

## 2026-04-28 - v1.6.2

- Added `maestro/memory/atlas/templates/ui-task-packet.md` for non-trivial visible UI work.
- Updated Atlas and frontend lane rules to follow: UI Task Packet -> implementation -> Storybook/product state -> Browser Use or screenshot evidence -> Agent Evidence.
- Tiny copy/CSS fixes may skip the packet when no new state coverage is needed.
- Bumped Atlas skill/control prompt to `1.6.2` and frontend prompts to `1.3.1`.

## 2026-04-28 - v1.6.1

- Tightened active run closure semantics: completed, closeout-ready, or ready-for-review runs move from `maestro/memory/runs/active/` to `maestro/memory/runs/archive/`.
- Active `final.md` files are allowed only with explicit `Status: awaiting-owner-review`, `Next owner action:`, and `Last updated:` markers.
- Added docs-memory checker coverage for active run closure drift.

## 2026-04-26 - v1.5.2

- Tightened Atlas direct no-run semantics: direct no-run now means current-chat execution by default, not a separate FE/BE lane chat.
- Added `MANUAL_HANDOFF_NO_RUN` as an explicit owner-requested exception for separate-chat prompts without a run folder.
- Clarified that Atlas-created separate FE/BE lane chats should normally be run-backed with a task id and run artifacts.
- Marked `lane-report.md` as a run-backed lane artifact, not a direct no-run artifact.

## 2026-04-26 - v1.5.1

- Added `maestro/memory/atlas/templates/agent-evidence.md` as the compact closeout or PR evidence template for non-trivial agent tasks.
- Updated Atlas skill and control prompt references so evidence stays lightweight and manual, not a required GitHub Actions gate or standalone artifact by default.

## 2026-04-25 - v1.5.0

- Moved active Atlas operational surfaces to `maestro/memory/atlas/`.
- Changed Atlas default memory reads from `platform/docs/ai/**` to `maestro/memory/index/*`, `maestro/memory/durable/*`, and targeted module packs.
- Changed run scaffolding target from `platform/docs/ai/runs/<task-id>/` to `maestro/memory/runs/active/<task-id>/`.
- Deleted remaining `platform/docs/ai/**` pointer files after final active-reference checks.
