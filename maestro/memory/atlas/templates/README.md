# Template Registry

Status: active

This folder holds workflow templates.
Templates are not durable memory.
Use them only when the current workflow step needs a structured artifact.

## Template roles

- `task-header.md` — start a new scoped task inside an existing chat
- `state-snapshot.md` — capture meaningful progress without dumping the whole chat
- `handoff-packet.md` — move work to a new chat or session
- `chat-start.md` — shared bootstrap prompt for a new memory-first chat
- `chat-start-backend.md` — backend addendum for chat bootstrap
- `chat-start-frontend.md` — frontend addendum for chat bootstrap
- `control-task.md` — Atlas-owned task contract and lane packet scaffold for run-backed work
- `lane-report.md` — FE/BE lane file scaffold that combines launch prompt, packet snapshot, and lane return report
- `agent-evidence.md` — compact final response or PR evidence block for non-trivial agent tasks
- `ui-task-packet.md` — compact UI task contract for non-trivial visible UI work before implementation

## Use rule

Think of templates as forms.
They are opened on demand during transitions:

- new task
- checkpoint
- handoff
- coordinated control run
- lane closeout
- non-trivial visible UI work
- non-trivial final closeout or PR summary

Direct no-run local tasks usually do not need `control-task.md` or `lane-report.md`.
Direct no-run means current-chat execution by default.
If a separate FE/BE chat is needed, create a run unless the owner explicitly asks
for `MANUAL_HANDOFF_NO_RUN`.
Tiny tasks may use a reduced `agent-evidence.md` block instead of the full form.
Tiny copy/CSS UI fixes may skip `ui-task-packet.md` when no new state coverage
is needed.


## Version note

Template frontmatter versions mirror `maestro/memory/atlas/automation-manifest.json`.
After a template version bump, run `python3 scripts/ai/automation_versions.py --write` and then `--check`.
