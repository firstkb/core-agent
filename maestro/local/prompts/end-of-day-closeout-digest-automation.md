# End-Of-Day Closeout Digest Automation Prompt

Suggested schedule: every workday at 17:30.

Suggested execution environment: `local`.

```text
[$maestro](/Volumes/HD/Projects/github/firstkb/core-agent/.agents/skills/maestro/SKILL.md)
Prepare a concise End-of-Day Closeout Digest for the core-agent workspace.

Respond in Russian. Keep file names, work slugs, commands, statuses, and
technical identifiers in their original language.

Purpose:
This is a short end-of-day continuity and closeout digest. It should not audit
the full active queue; Active Work Watchdog owns deeper queue health. Focus only
on what should be closed soon, what must stay active tomorrow, and what the
owner should do next.

Read only the minimum needed:
- AGENTS.md
- maestro/memory/START_HERE.md
- maestro/memory/index/read-routes.yaml
- active work folders under maestro/artifact/active/

Use canonical queue statuses:
- in_progress
- waiting_owner
- blocked
- close_ready
- archived

Do not invent additional statuses. If a work is stale or ambiguous, classify it
under the safest canonical status and explain briefly.

Report in this structure:

1. Closeout candidates
List only works that look close_ready:
- work slug;
- why it looks ready;
- final owner check needed, if any;
- recommended owner action.

2. Keep active tomorrow
List only works that should remain in_progress, waiting_owner, or blocked:
- work slug;
- canonical queue status;
- why it should stay active;
- next useful action.

3. Waiting on owner
List only works where the next step needs owner retest, product decision, focus
approval, formal approval gate, or close/archive confirmation:
- work slug;
- what owner input is needed;
- recommended owner response.

4. First prompt for tomorrow
Give one short ready-to-send prompt for Maestro to resume the highest-value
work tomorrow. The prompt should name the target work slug and the intended
next action.

5. One queue cleanup action
Give one concrete owner-facing action that would most reduce active-work noise.

Rules:
- Do not edit files.
- Do not create, close, archive, or move artifacts.
- Do not run tests or broad checks.
- Do not create new artifacts.
- Do not inspect product code unless an active artifact cannot be understood
  without it.
- Do not treat this digest as approval to close, archive, fix, or continue
  work.
- Keep the digest short, practical, and focused only on closeout/continuity.
```
