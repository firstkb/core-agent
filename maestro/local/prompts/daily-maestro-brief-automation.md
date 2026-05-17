# Daily Maestro Brief Automation Prompt

Suggested schedule: every workday at 08:00.

Suggested execution environment: `local`.

```text
[$maestro](/Volumes/HD/Projects/github/firstkb/core-agent/.agents/skills/maestro/SKILL.md)
Prepare a concise Daily Maestro Brief for the core-agent workspace.

Respond in English.

Purpose:
This is the morning owner-facing project control brief. It should help the
owner decide how to spend the first focused work hour. Do not make it a heavy
audit or CI run.

Read only the minimum needed:
- git status summary
- AGENTS.md
- maestro/memory/START_HERE.md
- maestro/memory/index/read-routes.yaml
- active work folders under maestro/artifact/active/

Allowed local cache write:
- Create or update only today's local morning cache:
  maestro/local/briefs/YYYY-MM-DD-morning-focus.md
- Replace YYYY-MM-DD with today's local date.
- If the file already exists, update the "Daily Maestro Brief" section without
  duplicating prior sections.
- Do not create a normal Maestro work artifact for this brief.
- Do not edit any file outside maestro/local/briefs/YYYY-MM-DD-morning-focus.md.

Write the owner-facing response and the local cache in English.

Report in this structure:

1. Repository status
- git status;
- uncommitted changes, if any;
- branch/HEAD risk, if any;
- obvious blockers.

2. Active works
For each relevant active work:
- work slug;
- current state;
- what is already done;
- what remains;
- whether it should stay active, be closed, archived, or needs owner decision.

3. Works that look ready to close
List active artifacts that look completed or stale-complete:
- why they look close-ready;
- what final owner check, if any, is still needed;
- recommended owner action:
  - "Owner can approve close/archive";
  - "Owner retest required before close";
  - "Keep active because implementation continues";
  - "Split follow-up into a new work before closing this one".

4. Open owner decisions / gates
List only real decisions, retests, approvals, or product choices that require
owner input.

5. Production quality watchlist
List up to 5 proactive quality concerns worth attention soon:
- missing or weak tests;
- monolithic or fragile areas;
- UX/user-facing risk;
- runtime/memory drift;
- repeated failure pattern.
Use existing artifacts/memory only. Do not inspect broad product code.

6. Top 5 best works for today
Rank the five most useful actions for today by impact and continuity value.
For each item include:
- action;
- why it matters;
- recommended next step;
- type: product/engineering, quality/test, architecture, UI/UX, or queue
  hygiene;
- whether it needs owner approval.

7. Best next actions
Give:
- one best product/engineering next action;
- one best quality/stability next action;
- one best queue hygiene next action;
- which one should be done first during the morning focus hour.

Also update today's local morning cache with:
- generation timestamp;
- Daily Maestro Brief summary;
- active work snapshot;
- close-ready works;
- owner decisions/gates;
- production quality watchlist;
- top 5 works for today;
- recommended first focus-hour action.

Rules:
- Do not edit product files.
- Do not create, close, archive, or move work artifacts.
- Do not run tests in this brief.
- Do not run broad code searches unless needed to understand an active artifact.
- Do not create new durable artifacts unless the owner explicitly asks.
- If visible frontend work is a top priority, say whether UI Quality Pack,
  Browser Use, Computer Use, or Build Web Apps should be considered later
  during execution.
- Keep the brief concise, practical, and owner-facing.
```
