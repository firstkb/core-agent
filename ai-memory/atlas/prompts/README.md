# Prompt Registry

Status: active

This folder holds stable base prompts for the Atlas workflow.
These files are not canonical product memory.
They are operational behavior contracts.

## Prompt families

### Atlas / Control

- `control-chat-prompt-v1.md`
  - prompt_id: `control-chat`
  - current semantic version: see `ai-memory/atlas/automation-manifest.json`
  - owner: `ramp-platform-v108`
  - used with `Atlas` (`$ramp-conductor`)

### Frontend lane

- `frontend-prompt-v1.md`
  - full lane prompt for new, risky, or run-backed FE work
- `frontend-prompt-compact-v1.md`
  - compact lane bootstrap for direct local FE work or an already-stable FE stream

### Backend lane

- `backend-prompt-v1.md`
  - full lane prompt for new, risky, or run-backed BE work
- `backend-prompt-compact-v1.md`
  - compact lane bootstrap for direct local BE work or an already-stable BE stream

## Versioning rules

- filenames stay on a stable major family (`v1`) to avoid rename churn during pilot iterations
- semantic patch/minor versions are edited in `ai-memory/atlas/automation-manifest.json` and mirrored into file frontmatter
- record prompt versions in `ai-memory/runs/active/<task-id>/task.md` when a run exists
- do not silently rewrite base prompts inside a live task
- generate task packets on top of the stable base prompt instead of inventing a new base prompt every time
- bump the prompt version intentionally when behavior contract changes materially
- after a version bump, run `python3 scripts/ai/automation_versions.py --write` and then `--check`

## Selection rules

Atlas chooses the prompt plan and must emit the ready-to-paste lane launch prompt when a new lane chat is needed.
Use these defaults:

- new task and routing unclear -> start with Atlas
- direct tiny frontend task -> compact FE prompt
- direct tiny backend task -> compact BE prompt
- new run-backed FE lane -> full FE prompt
- new run-backed BE lane -> full BE prompt
- cross-stack work -> Atlas control prompt + whichever lane prompts Atlas selects

## Naming rule

`Atlas` is the human display name fixed in the skill metadata.
`$ramp-conductor` is the technical invocation name.
Prompt files may refer to either form, but technical automation should continue to use the invocation name.


## Atlas intake note

For new platform tasks, start with Atlas. Atlas decides run/no-run, task-id, prompt plan, and chat topology. The lane prompts are execution prompts, not intake prompts. Atlas should not require a second user message just to produce the lane bootstrap text.
