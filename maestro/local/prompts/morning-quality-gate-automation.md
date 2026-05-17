# Morning Quality Gate Automation Prompt

Suggested schedule: every workday at 08:10.

Suggested execution environment: `local`.

```text
[$maestro](/Volumes/HD/Projects/github/firstkb/core-agent/.agents/skills/maestro/SKILL.md)
Prepare a concise Morning Quality Gate report for the core-agent workspace.

Respond in English.

Purpose:
This is the morning green/yellow/red readiness check before focused work. It
should identify critical issues to fix today, not perform broad implementation.

Read first:
- AGENTS.md
- maestro/memory/START_HERE.md
- maestro/memory/index/read-routes.yaml

Run only lightweight checks:
- scripts/preflight.sh

Allowed local cache write:
- Create or update only today's local morning cache:
  maestro/local/briefs/YYYY-MM-DD-morning-focus.md
- Replace YYYY-MM-DD with today's local date.
- If the file already exists, update the "Morning Quality Gate" section without
  duplicating prior sections.
- Do not create a normal Maestro work artifact for this gate.
- Do not edit any file outside maestro/local/briefs/YYYY-MM-DD-morning-focus.md.

Write the owner-facing response and the local cache in English.

Report in this structure:

1. Gate result
- green, yellow, or red;
- checks run;
- failures or warnings;
- skipped checks and why.

2. Critical issues to fix first
List only issues that can block productive work, evidence quality, runtime
trust, or user-facing stability.

3. Test coverage opportunities
List up to 3 areas where adding or improving targeted tests would reduce real
product risk. Do not suggest generic test work.

4. Architecture / monolith watch
List up to 3 areas that appear to need decomposition or boundary cleanup based
on current artifacts, known memory, or check output. Do not perform broad code
archaeology.

5. UI/UX readiness
If active frontend-visible work exists, say whether today should include:
- Browser Use evidence;
- Computer Use / Chrome desktop visual check;
- UI Quality Pack;
- Build Web Apps skills.
Only recommend tools when they would materially improve quality.

6. Best first fix
Give one concrete issue Maestro should fix first if the owner says "start
morning stabilization".

Also update today's local morning cache with:
- generation timestamp;
- Morning Quality Gate result;
- checks run and evidence summary;
- critical issues;
- targeted test opportunities;
- architecture / monolith watch;
- UI/UX readiness;
- best first fix;
- updated 10:00 focus-hour recommendation.

Rules:
- Do not edit product files.
- Do not create, close, archive, or move work artifacts.
- Do not commit.
- Do not run broad product tests unless scripts/preflight.sh requires them.
- Do not inspect broad product code unless a check failure requires targeted
  diagnosis.
- Do not create new durable artifacts unless the owner explicitly asks.
- Keep the report concise and action-oriented.
```
