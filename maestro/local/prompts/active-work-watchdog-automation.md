# Active Work Watchdog Automation Prompt

Suggested schedule: every workday at 18:00.

Suggested execution environment: `local`.

```text
[$maestro](/Volumes/HD/Projects/github/firstkb/core-agent/.agents/skills/maestro/SKILL.md)
Prepare a concise Active Work Watchdog report for the core-agent workspace.

Respond in Russian. Keep file names, work slugs, commands, statuses, and
technical identifiers in their original language.

Purpose:
This is an evening active-queue health check. It should keep
maestro/artifact/active truthful, prevent completed work from staying active,
and surface work that needs owner retest, decision, or unblock before tomorrow.

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
under the safest canonical status and explain why.

Report in this structure:

1. Active queue status
- total active works;
- count by canonical queue status;
- active queue health: green, yellow, or red;
- one-sentence reason for the health rating.

2. Work-by-work audit
For each relevant active work:
- work slug;
- canonical queue status;
- goal alignment: owner strategy -> product/user risk -> current action -> exit
  criteria;
- last meaningful progress or evidence;
- what is already done;
- what remains;
- why this status is correct;
- recommended owner action, using one of these shapes:
  - "Owner can approve close/archive";
  - "Owner retest required before close";
  - "Owner decision required before continuing";
  - "Keep active because implementation continues";
  - "Split follow-up into a new work before closing this one";
  - "No action needed".

3. Close-ready works
List only works with status close_ready:
- why they look close-ready;
- what final owner check, if any, is still needed;
- recommended owner action.

4. Waiting on owner
List only works with status waiting_owner:
- what owner input is needed;
- whether it is retest, product decision, focus approval, formal approval gate,
  or close/archive confirmation;
- recommended next step.

5. Blocked works
List only works with status blocked:
- blocker;
- who owns the unblock;
- safest next step.

6. Tomorrow continuity
Give:
- what should stay active tomorrow;
- what should not be started until a gate/decision is resolved;
- the best first Maestro prompt for tomorrow if the owner wants to continue
  from this report.

7. Single best queue hygiene action
Give one concrete owner-facing action that would most improve the active queue.

Rules:
- Do not edit files.
- Do not create, close, archive, or move artifacts.
- Do not run tests or broad checks.
- Do not create new artifacts.
- Do not inspect product code unless an active artifact cannot be understood
  without it.
- Do not treat this report as approval to close, archive, fix, or continue
  work.
- Keep the report concise, practical, and owner-facing.
```
