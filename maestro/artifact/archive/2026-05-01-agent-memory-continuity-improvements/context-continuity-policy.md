# Context Compaction Continuity Policy

- Status: `implemented in Slice 1`
- Scope: planning proposal for Maestro continuity after automatic context
  compaction, thread summary, resume, or long multi-turn drift.
- Date: 2026-05-01

## Problem

Automatic context compaction can remove details that matter for correct
execution:

- the original owner request;
- the latest owner correction;
- current scope and out-of-scope boundaries;
- active or archived artifact path;
- approval gates;
- changed files and checks already run;
- unresolved owner decisions;
- the next allowed action.

The risk is not only forgetting facts. The larger risk is that Maestro continues
from an older "ghost" task or invents missing scope after compaction.

## Core Principle

Maestro should not try to keep every detail in chat context. Maestro should make
work recoverable.

Continuity should come from the smallest reliable source:

1. current thread summary and latest owner message for tiny T0 work;
2. `work.md` for T1+ persisted work;
3. `evidence.md`, `closeout.md`, approvals, and handoffs only when the task
   already needs them;
4. `maestro/memory/START_HERE.md` and
   `maestro/memory/index/read-routes.yaml` for repository/product memory
   baseline.

## T0 Current-Chat Work

T0 work stays artifact-free by default.

Use T0 when:

- the task is tiny and local;
- no meaningful product or architecture decision is being made;
- no approval gate exists;
- no delegation, durable evidence, or multi-step continuation is needed;
- losing detailed chat context would not materially change the answer or fix.

After compaction during T0 work, Maestro should:

1. reconstruct the latest owner request from the available thread summary and
   current message;
2. reread `AGENTS.md`, `maestro/memory/START_HERE.md`, and
   `maestro/memory/index/read-routes.yaml` for repository/product work;
3. inspect current repo state only if it materially affects the task;
4. continue only if scope and next action are clear;
5. ask one focused owner question when scope, acceptance, or next action cannot
   be reconstructed safely.

T0 anti-rule: do not create an artifact only because compaction exists as a
general possibility.

## Promote T0 To T1

Maestro should promote T0 to T1 and create or update `work.md` when the work
becomes continuity-sensitive.

Promotion triggers:

- the task becomes multi-turn with meaningful state;
- the owner gives several constraints, corrections, or decisions that must not
  be lost;
- the task touches multiple files, packages, apps, or FE/BE boundaries;
- the work needs delegation, non-trivial evidence, or review;
- scope, out-of-scope, or acceptance criteria matter;
- approval gates, auth, tenancy, migrations, release, security, or destructive
  operations are involved;
- the work pauses, resumes, or is likely to continue after compaction;
- Maestro cannot safely reconstruct the next action from chat summary alone.

Creating `work.md` is continuity capture only. It does not authorize product
code edits, high-risk work, or release/deploy action.

## T1+ Persisted Work

For T1+ work, `work.md` is the continuity anchor.

`work.md` should preserve:

- owner goal in the owner's current terms;
- latest owner correction or decision that changes direction;
- agreed scope and explicit out-of-scope;
- active status;
- artifact path;
- current slice or phase;
- gates and approvals;
- changed files or allowed write scope when relevant;
- evidence/check status;
- unresolved owner decisions;
- next allowed action.

After compaction during T1+ work, Maestro should:

1. reread `AGENTS.md`;
2. reread `maestro/memory/START_HERE.md` and
   `maestro/memory/index/read-routes.yaml` for repository/product work;
3. reread the active `work.md`;
4. reread `evidence.md`, `closeout.md`, approval records, and handoffs only
   when they affect the next action;
5. verify whether the owner's latest message changes the stored work state;
6. update `work.md` before acting if the recovered state is stale or incomplete;
7. stop and ask the owner when the recovered state conflicts with the latest
   owner message or cannot identify the next safe action.

## Do Not Do

- Do not rely on memory to recover product code facts that should be checked in
  source code.
- Do not reopen archived artifacts unless the owner explicitly continues that
  archived work or asks for historical reconstruction.
- Do not treat compaction summaries as approvals.
- Do not continue high-risk work after compaction until gates and scope are
  revalidated.
- Do not create packets, handoffs, or extra files when a compact `work.md`
  update is enough.
- Do not ask broad "what should I do?" questions when a focused clarification
  can recover the next action.

## Proposed Runtime Surfaces

If accepted, implementation should update only the smallest useful surfaces:

- `maestro/docs/runtime-contract.md`: canonical continuity behavior after
  compaction/resume.
- `.agents/skills/maestro/SKILL.md`: compact operational rule for T0/T1
  continuity and post-compaction recovery.
- `.codex/agents/maestro_vnext.toml`: short invariant for native agent runtime.
- `maestro/templates/work.md.tmpl`: add optional fields for latest owner
  correction, current phase, gates, evidence status, unresolved decisions, and
  next allowed action if the template needs stronger continuity.

Do not add a new memory layer unless repeated work proves `work.md` plus memory
baseline is insufficient.

## Acceptance Criteria

A future implementation should make these scenarios clear:

- tiny T0 task continues without artifact when context loss is harmless;
- T0 task promotes to T1 when owner intent or next action would be fragile;
- T1+ task after compaction resumes from `work.md` before acting;
- high-risk/gated task after compaction revalidates gates before continuing;
- ambiguous post-compaction state returns to owner with a focused question;
- archived work is not accidentally reopened as active work.

## Recommendation

Implement this before restructuring `decisions-log.md`.

Reason: decisions-log restructuring improves retrieval, but context continuity
protects the active owner task itself. It is the foundation for reliable long
multi-turn work without making every tiny request bureaucratic.
