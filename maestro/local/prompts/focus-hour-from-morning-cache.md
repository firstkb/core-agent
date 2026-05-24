# Focus Hour From Morning Cache Prompt

Use this prompt in a new Maestro chat at the start of the owner focus hour.

```text
[$maestro](/Volumes/HD/Projects/github/firstkb/core-agent/.agents/skills/maestro/SKILL.md)
Start the Owner + Maestro Focus Hour for the core-agent workspace.

Respond in Russian. Keep file names, work slugs, commands, statuses, and
technical identifiers in their original language. Persisted work artifacts, if
created later, must stay in English.

The morning cache may be written in English. Do not copy English section
headings into the owner-facing answer. Summarize and translate the cache into
Russian, preserving only technical identifiers in their original language.

Read first:
- AGENTS.md
- maestro/memory/START_HERE.md
- maestro/memory/index/read-routes.yaml
- today's local morning cache:
  maestro/local/briefs/YYYY-MM-DD-morning-focus.md

Replace YYYY-MM-DD with today's local date. If the local morning cache is
missing, say so and fall back to a minimal Daily Brief style read. Do not
recreate the morning cache unless the owner asks.

Purpose:
Use the Daily Maestro Brief and Morning Quality Gate to choose the
highest-value work for the next 60 minutes. The goal is to close critical
issues, improve production quality, reduce user-facing risk, add missing
targeted tests, or clean up architecture/monolith pressure where it genuinely
improves quality.

Do not start by re-reading the whole repo. Use route-specific reads only after
choosing the candidate action.

I prohibit the editing of any data in the database, except with my prior approval and upon presentation of proof that such editing is necessary.

Report first, before editing, using these Russian section headings:

1. Короткий вывод для owner
Give 3-5 bullets:
- current morning status: green/yellow/red;
- the main risk or blocker;
- the best use of the next 60 minutes;
- goal alignment: owner strategy -> product/user risk -> today's action -> exit
  criteria;
- whether this is product work, quality/test work, architecture cleanup, UI/UX,
  or queue hygiene.

2. Что требует решения owner
List only decisions the owner actually needs to make now.
Separate:
- focus approval: permission to spend this Focus Hour on a candidate;
- formal approval gate: high-risk, auth, tenant isolation, migration,
  destructive, secrets, production config, CI/CD, deploy/release, memory-root
  migration, or runtime restore approval.

3. Кандидаты на Focus Hour
Propose up to 3 candidate actions.
For each candidate include:
- label: A, B, or C;
- action;
- goal alignment: owner strategy -> product/user risk -> today's action -> exit
  criteria;
- why it matters for product quality or user risk;
- expected outcome in 60 minutes;
- exit criteria: what must be true to call this hour successful;
- likely files/areas involved;
- evidence/checks needed;
- risk level: low, medium, high;
- approval needed: focus approval only, formal approval gate, or no approval.

4. Рекомендация Maestro
Choose one candidate as the best first action.
Explain briefly:
- why this is the highest-leverage action now;
- why the other candidates should wait;
- what Maestro will do first if owner approves.

5. Что не трогаем сейчас
List important things that will not be touched during this Focus Hour unless
the owner expands scope.

6. Согласование выполнения
Ask the owner to choose one:
- "Approve A";
- "Approve B";
- "Approve C";
- "Only analyze";
- "Close/archive candidates only";
- "Choose a different action: ...".

Rules:
- Do not copy English headings from the morning cache.
- Translate the owner-facing report into Russian.
- Preserve technical identifiers in their original language.
- Do not edit product files before owner approves the selected action.
- If a candidate needs only focus approval, do not call it a formal approval
  gate.
- If formal approval is required, state the exact scoped action that needs
  approval.
- If a candidate includes a retest that may lead to a fix, separate retest
  approval from fix approval unless the owner explicitly approves both.
- Do not perform high-risk actions without explicit scoped approval.
- Do not run broad tests unless the selected action needs them.
- If the selected action is visible frontend work, consider UI Quality Pack,
  Browser Use, Computer Use, or Build Web Apps only when they materially
  improve evidence or result quality.
- After owner approval, execute in the smallest useful slice, create or resume a
  normal Maestro work artifact only when continuity/evidence/accountability
  requires it, run targeted checks, and return concise evidence plus next step.
```
