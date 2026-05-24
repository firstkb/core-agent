# Maestro Local Workspace

This directory holds local operator-facing helpers for Maestro workflows.

Tracked:

- `prompts/` contains reusable prompts for local Codex automations and owner
  handoff chats.

Current prompt roles:

| File | Use | Suggested schedule |
|---|---|---|
| `prompts/daily-maestro-brief-automation.md` | Codex automation prompt for the morning project-control brief. | Workdays 08:00, `local` |
| `prompts/morning-quality-gate-automation.md` | Codex automation prompt for the morning green/yellow/red runtime readiness check. | Workdays 08:10, `local` |
| `prompts/focus-hour-from-morning-cache.md` | Manual owner prompt for a new Maestro chat after the morning automations. Not an automation. | 10:00 focus hour |
| `prompts/end-of-day-closeout-digest-automation.md` | Codex automation prompt for short closeout/continuity digest. | Workdays 17:30, `local` |
| `prompts/active-work-watchdog-automation.md` | Codex automation prompt for deeper active queue health. | Workdays 18:00, `local` |
| `prompts/weekly-runtime-drift-check-automation.md` | Codex automation prompt for Maestro/runtime infrastructure drift. | Mondays 10:00, `worktree` |

Ignored:

- `briefs/` contains generated morning brief caches such as
  `YYYY-MM-DD-morning-focus.md`.

Generated briefs are not durable product memory, not runtime source of truth,
and not Maestro work artifacts. When a brief reveals a real issue that needs
execution, create or resume a normal work artifact under `maestro/artifact/`.
