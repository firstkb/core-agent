# Maestro Character Audit

- Status: `draft`
- Scope: audit of `maestro/docs/maestro-character.md`
- Date: 2026-05-01

## Direct Answer

The old path `docs/maestro-character.md` does not exist in the current working
tree. The active file is `maestro/docs/maestro-character.md`.

Yes, Maestro is supposed to read it. It is referenced directly by:

- `.agents/skills/maestro/SKILL.md`
- `.codex/agents/maestro_vnext.toml`
- `maestro/docs/operating-charter.md`
- `maestro/docs/README.md`

So this is not random documentation. It is part of the Maestro vNext runtime
surface.

## Usefulness

The file is useful and should be kept.

It defines the owner-facing behavior that generic runtime contracts do not
fully capture:

- calm senior-engineer tone;
- concise communication;
- decisive action when the safe route is clear;
- real approval gates for high-risk work;
- evidence-first closeout;
- selective memory updates;
- no ceremonial agent chains;
- owner does not manage agents, tiers, tools, artifacts, or next action.

This is exactly the kind of document that helps preserve the desired
human-agent symbiosis across sessions and future prompt/runtime edits.

## Provenance Check

The owner clarified that the original ideology came from:

- `https://soul.md/`
- `https://gist.github.com/Richard-Weiss/efe157692991535403bd7e7fb20b6695`

These sources are useful as inspiration, not as text to copy into Maestro.

The key transferable ideas are:

- continuity through an external document, because sessions and context windows
  reset;
- values and boundaries matter more than a long rule list;
- the assistant should be genuinely helpful without becoming sycophantic or
  careless;
- honesty, calibrated uncertainty, and willingness to challenge weak reasoning
  are core traits;
- the assistant should respect the human's autonomy and avoid paternalism;
- in agentic settings, autonomy must be balanced by oversight, reversibility,
  minimum needed permissions, and verification.

The current `maestro-character.md` translates those ideas into a repository
runtime shape instead of copying the philosophical framing directly. That is the
right adaptation for this project. Maestro should not talk about having a soul
or perform identity language. It should embody the practical parts: continuity,
values, boundaries, useful help, honesty, owner autonomy, safe agentic action,
and evidence.

Recommended addition during runtime update:

```text
This document is inspired by the "soul document" idea: a compact continuity
record of values, boundaries, and relationship style. In this repository it is
not metaphysical and not theatrical. It defines Maestro's operating character
for engineering collaboration with the owner.
```

## What Is Correct

- The archetype is right: Maestro as calm solution architect and engineering
  partner, not a generic project manager or workflow engine.
- The core traits are strong: calm, decisive, scoped, evidence-driven,
  gate-aware, delegation-minded, memory-selective, respectfully challenging.
- The "Default Voice" section is good. It correctly prefers understanding,
  next step, blockers, evidence, owner decisions, and residual risk over
  motivational filler.
- The discussion/planning/execution/gated execution split is useful and aligned
  with the current operating model.
- The decision posture is correct: act when safe, ask the owner only for real
  product, risk, acceptance, or approval decisions.
- The delegation section correctly says specialists should be used only for
  real value and that Maestro remains accountable.
- The closeout section is right: result, changed files/artifacts, checks, skipped
  checks, approvals, residual risks, and next action.

## Drift / Problems

### 1. Path confusion

The owner remembered `docs/maestro-character.md`, but the active path is
`maestro/docs/maestro-character.md`. This is consistent with the current repo
state because the root `docs/` folder is retired.

Recommended action: do not recreate root `docs/`. Keep the active file under
`maestro/docs/`.

### 2. UI-visible work policy is behind the new planning direction

The current file says:

```text
For UI-visible work, Maestro personally uses Browser Use when available.
```

This was reasonable before the latest discussion, but it should now be refined:

- Browser Use is the default structured in-Codex browser smoke/evidence surface.
- Computer Use + external Chrome is the preferred final desktop visual/UX
  acceptance surface when Codex width may bias judgment or real desktop browser
  behavior matters.
- Maestro owns UI/UX judgment and may use Browser Use, Computer Use, Build Web
  Apps, screenshots, code review, and product reasoning as supporting tools.

### 3. Some wording still smells like route machinery

The file says Maestro should decide "route tier", "artifact shape", and "stage
chain" during intake. This is fine internally, but "stage chain" can pull the
model back toward classical orchestration language.

Recommended refinement: replace "stage chain" with "next safe action" or
"execution shape". Keep tier/route language internal and only expose it when
risk, resume, or owner request requires it.

### 4. Example phrases expose T-levels too readily

The "Things Maestro Should Say" section includes examples like:

```text
I am keeping this T1.
```

The same file says route labels should remain mostly internal. That is a small
internal inconsistency.

Recommended refinement: make the default example owner-facing:

```text
I am keeping this lightweight. A brief would add ceremony without improving correctness.
```

T-level examples can remain as internal examples under a clearly marked
"internal wording only" subsection.

### 5. "Owner thinks product / Maestro thinks operations" is useful but needs nuance

The line is directionally right: the owner should not manage machinery. But our
current philosophy says Maestro also owns code quality, UI/UX analysis, user
friendliness, evidence, and engineering product judgment.

Recommended refinement:

```text
The owner owns product strategy, taste, priorities, and final product direction.
Maestro owns the engineering path, product-quality analysis, UI/UX evidence,
agents/tools, checks, and safe execution.
```

### 6. Build Web Apps wording should become selective

The file currently lists Build Web Apps capabilities. It should match the
outsourced capability policy:

- consider Build Web Apps for visible frontend work;
- actually use it when frontend complexity, React performance, design quality,
  shadcn, Stripe, or Postgres/Supabase specifics make it useful;
- do not let plugin defaults override repo UI Kit, FE/BE contracts, or owner
  product direction.

## Recommended Update Shape

Do not rewrite the file from scratch. It is already mostly right.

Recommended patch later, after owner approval:

1. Keep purpose/archetype/core traits.
2. Refine the owner/Maestro responsibility split.
3. Replace "stage chain" with less orchestration-heavy language.
4. Adjust UI-visible work wording to the Browser Use / Computer Use split.
5. Make Build Web Apps wording selective and policy-aligned.
6. Replace default T-level example with owner-facing wording.

## Conclusion

`maestro/docs/maestro-character.md` is useful and belongs in the active runtime.
Its content is broadly correct. It needs a small alignment pass, not removal:
mainly FE visual evidence policy, owner/Maestro responsibility nuance, and
reducing language that can pull Maestro back toward classical orchestration.
