# Weekly Runtime Drift Check Automation Prompt

Suggested schedule: Mondays at 10:00.

Suggested execution environment: `worktree`.

```text
[$maestro](/Volumes/HD/Projects/github/firstkb/core-agent/.agents/skills/maestro/SKILL.md)
Prepare a concise Weekly Runtime Drift Check for the core-agent workspace.

Respond in Russian. Keep file names, work slugs, commands, statuses, and
technical identifiers in their original language.

Purpose:
This is a weekly Maestro infrastructure drift check. It should verify that the
runtime, memory routing, local automation prompts, artifact model, and active
hot paths still agree. It is not a product QA run and not a broad code audit.

Read only the minimum needed:
- AGENTS.md
- maestro/memory/START_HERE.md
- maestro/memory/index/read-routes.yaml
- maestro/docs/runtime-contract.md
- maestro/docs/artifact-model.md
- maestro/templates/work.md.tmpl
- maestro/local/prompts/*.md
- relevant runtime files only if checks fail or drift is suspected.

Run only lightweight runtime checks:
- scripts/preflight.sh

Report in this structure:

1. Check results
- checks run;
- pass/fail result;
- any skipped checks and why;
- overall health: green, yellow, or red.

2. Runtime source-of-truth drift
Check for contradictions or stale wording between:
- AGENTS.md;
- maestro/memory/START_HERE.md;
- maestro/memory/index/read-routes.yaml;
- maestro/docs/runtime-contract.md;
- maestro/docs/artifact-model.md;
- maestro/templates/work.md.tmpl;
- .agents/skills/maestro/SKILL.md only if needed.

Report only actionable drift.

3. Artifact and queue model health
Check:
- work.md template includes lightweight Goal Alignment;
- active work queue uses or can map to canonical statuses:
  - in_progress
  - waiting_owner
  - blocked
  - close_ready
  - archived
- morning/local brief prompts do not create durable work artifacts
  automatically;
- active artifacts are not being treated as product source of truth.

4. Automation prompt health
Check local prompt files under maestro/local/prompts/:
- Daily Brief remains lightweight and cache-only;
- Morning Quality Gate remains a readiness check, not implementation;
- Focus Hour separates focus approval from formal approval gates;
- Watchdog/Closeout wording, if present in active automations, uses canonical
  queue statuses.

5. Legacy/stale reference scan
Look for active-hot-path references that could mislead new work:
- old artifacts/<module>/... usage outside explicit legacy continuation;
- deleted platform/docs/ai/**;
- old maestro/memory/runs/**;
- old maestro/memory/retired-runtime/**;
- old CLI/status lifecycle wording;
- stale scripts/ai/** references.

6. Memory and routing health
Check:
- whether START_HERE and read-routes still point to existing paths;
- whether optional packs remain lazy-read, not default hot path;
- whether decisions/current-state look obviously stale or oversized;
- whether raw local reference folders are not required by active runtime.

7. Top cleanup recommendations
Give up to 5 recommendations ranked by priority.
For each:
- issue;
- why it matters;
- suggested fix;
- priority: P0, P1, or P2;
- whether owner decision is needed.

8. Single best cleanup action
Give one concrete next action for Maestro or owner.

Rules:
- Do not edit files.
- Do not create, close, archive, or move artifacts.
- Do not commit.
- Do not run broad product tests.
- Do not read unrelated product code.
- Do not turn this into a full repository audit.
- Keep the report concise, practical, and owner-facing.
```
